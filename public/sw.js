// Service worker — Dinislam (mode hors ligne + notifications push)

// ============ MODE HORS LIGNE ============
// RÈGLE ABSOLUE (Nadia, 2026-10-27, appliquée à Dinislam le 2026-11-02) : l'appli doit s'ouvrir 24h/24,
// sans réseau, en mode avion ou avec un wifi « connecté mais sans Internet ».
// Avant le 2026-11-02, aucun script de l'appli n'était gardé en mémoire : sans réseau = écran blanc.
//
// 1. À l'installation, TOUT le nécessaire est téléchargé d'un coup (page, scripts de toutes les pages,
//    styles, polices, icônes) : la liste PRECACHE est écrite à chaque mise en ligne par vite.config.ts.
// 2. Ouverture de l'appli : réseau limité à 3 s, sinon la page en mémoire.
// 3. Fichiers de l'appli : mémoire d'abord (instantané, marche sans réseau).
// 4. Données (Supabase /rest/) : réseau limité à 4 s, sinon la dernière copie connue de la personne.
// 5. Audios, vidéos, PDF et fichiers du stockage : toujours le réseau (trop lourds pour être tous gardés).
//    Les pages du Coran ont leur propre mémoire (« dinislam-coran-pages-v1 », CoranReader) : jamais effacée ici.
var VERSION = '__BUILD_VERSION__';
var PRECACHE = self.__PRECACHE || [];
var STATIC_CACHE = 'dinislam-static-' + VERSION;
var RUNTIME_CACHE = 'dinislam-runtime';
var META_CACHE = 'dinislam-meta';
var API_CACHE_PREFIX = 'dinislam-api-v1-';
var SHELL = ['/', '/manifest.json', '/icon-192.png', '/icon-512.png'];
var NAV_TIMEOUT_MS = 3000;
var DATA_TIMEOUT_MS = 4000;

// Identifie la personne connectée à partir de son jeton (sans vérifier la signature, juste pour
// séparer la mémoire par personne : un élève ne voit jamais hors ligne les données d'un autre
// élève qui a utilisé le même appareil).
function getUserIdFromRequest(request) {
  var auth = request.headers.get('Authorization');
  if (!auth) return null;
  try {
    var token = auth.replace('Bearer ', '');
    var payload = token.split('.')[1];
    var json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return json.sub || null; // la clé publique (anon) n'a pas de « sub »
  } catch (e) {
    return null;
  }
}

function isSupabaseDataRequest(url) {
  return url.hostname.indexOf('.supabase.co') !== -1 && url.pathname.indexOf('/rest/v1/') === 0;
}

// Réseau limité dans le temps : un wifi « sans Internet » peut laisser une requête en attente plusieurs minutes.
function withTimeout(promise, ms) {
  return new Promise(function(resolve, reject) {
    var t = setTimeout(function() { reject(new Error('timeout')); }, ms);
    promise.then(function(r) { clearTimeout(t); resolve(r); }, function(e) { clearTimeout(t); reject(e); });
  });
}

// Safari refuse une page « redirigée » servie par le service worker : on la recopie dans une réponse neuve.
function clean(response) {
  if (!response || !response.redirected) return Promise.resolve(response);
  return response.blob().then(function(body) {
    return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
  });
}

// Dernière personne connectée sur cet appareil : secours hors ligne quand le jeton a expiré.
function getLastUser() {
  return caches.open(META_CACHE).then(function(c) { return c.match('/__last_user'); })
    .then(function(r) { return r ? r.text() : null; }).catch(function() { return null; });
}

self.addEventListener('message', function(event) {
  var d = event.data || {};
  if (d.type === 'CURRENT_USER' && d.id) {
    event.waitUntil(caches.open(META_CACHE).then(function(c) { return c.put('/__last_user', new Response(String(d.id))); }));
  }
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then(function(cache) {
      var urls = SHELL.concat(PRECACHE.filter(function(u) { return SHELL.indexOf(u) === -1; }));
      // Un fichier à la fois : un fichier manquant n'empêche pas les autres d'être mis en mémoire.
      // ⚡ Les fichiers /assets/ ne changent jamais de contenu (leur nom change) : ceux déjà gardés par la version
      // précédente sont recopiés sans être retéléchargés (mise à jour légère sur les forfaits mobiles des élèves).
      return Promise.all(urls.map(function(u) {
        var reuse = u.indexOf('/assets/') === 0 ? caches.match(u) : Promise.resolve(null);
        return reuse.then(function(old) {
          if (old) return cache.put(u, old);
          return fetch(new Request(u, { cache: 'reload' })).then(function(res) {
          if (!res || !res.ok) return;
            return clean(res).then(function(r) { return cache.put(u, r); });
          });
        }).catch(function() { /* réessayé à la prochaine visite */ });
      }));
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(names) {
      var hadOldVersion = names.some(function(n) {
        return n.indexOf('dini-bismillah-') === 0 || (n.indexOf('dinislam-static-') === 0 && n !== STATIC_CACHE);
      });
      return caches.open(STATIC_CACHE).then(function(c) { return c.match('/'); }).then(function(ok) {
        // On n'efface une ancienne version QUE si la nouvelle contient bien la page d'accueil.
        // Jamais effacés : la mémoire des pages du Coran, les données, le repère de la personne.
        if (!ok) return hadOldVersion;
        return Promise.all(names.filter(function(n) {
          return n.indexOf('dini-bismillah-') === 0 || (n.indexOf('dinislam-static-') === 0 && n !== STATIC_CACHE) || n === RUNTIME_CACHE;
        }).map(function(n) { return caches.delete(n); })).then(function() { return hadOldVersion; });
      });
    }).then(function(hadOldVersion) {
      return self.clients.claim().then(function() {
        // Nouvelle version mise en ligne : les pages ouvertes se rechargent dessus (comme avant).
        if (!hadOldVersion) return;
        return self.clients.matchAll({ type: 'window' }).then(function(list) {
          list.forEach(function(client) { client.postMessage({ type: 'FORCE_RELOAD' }); });
        });
      });
    })
  );
});

// Cherche une réponse dans la mémoire de l'appli (version actuelle d'abord).
// ignoreVary : un fichier mis en mémoire à l'installation doit être retrouvé même si le serveur l'a marqué
// « Vary: Origin » (les scripts de l'appli sont demandés avec un en-tête Origin, pas à l'installation) —
// sinon : écran blanc hors ligne (constaté au test du 2026-11-02).
var MATCH_OPTS = { ignoreVary: true };
function fromCache(key) {
  return caches.open(STATIC_CACHE).then(function(c) { return c.match(key, MATCH_OPTS); }).then(function(r) {
    return r || caches.open(RUNTIME_CACHE).then(function(c) { return c.match(key, MATCH_OPTS); });
  });
}

function shellResponse() {
  return fromCache('/').then(function(r) {
    if (r) return clean(r);
    return fromCache('/index.html').then(function(r2) { return r2 ? clean(r2) : null; });
  });
}

self.addEventListener('fetch', function(event) {
  var request = event.request;
  // Écritures (POST/PATCH/DELETE) : toujours le réseau, jamais de mémoire
  if (request.method !== 'GET') return;
  if (request.url.indexOf('http') !== 0) return;
  var url = new URL(request.url);

  // Ouverture de l'appli / navigation : réseau 3 s maximum, sinon la page en mémoire.
  if (request.mode === 'navigate') {
    var net = fetch(request);
    event.respondWith(
      withTimeout(net, NAV_TIMEOUT_MS).then(function(response) {
        var type = response.headers.get('content-type') || '';
        if (!response.ok || type.indexOf('text/html') === -1) throw new Error('bad');
        return clean(response);
      }).catch(function() {
        return shellResponse().then(function(cached) {
          if (cached) return cached;
          // Rien en mémoire (tout premier lancement sans réseau) : on attend quand même le réseau
          return net.then(clean, function() {
            return new Response(
              '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
              '<body style="font-family:-apple-system,sans-serif;background:#1e3a5f;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:24px">' +
              '<div><div style="font-size:48px">📡</div><h2>Pas de connexion</h2><p>L\'appli n\'a pas encore été enregistrée sur cet appareil.<br>Ouvre-la une fois avec Internet : ensuite elle s\'ouvrira toujours, même sans réseau.</p>' +
              '<button onclick="location.reload()" style="padding:10px 18px;border-radius:12px;border:0;background:#D4AF37;color:#1e3a5f;font-weight:bold;font-size:16px">Réessayer</button></div></body>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
          });
        });
      })
    );
    return;
  }

  // Données Supabase : réseau 4 s maximum, mise en mémoire par personne, sinon dernière copie.
  if (isSupabaseDataRequest(url)) {
    var uid = getUserIdFromRequest(request);
    var net2 = fetch(request);
    event.respondWith(
      (uid ? Promise.resolve(uid) : getLastUser()).then(function(who) {
        var cacheName = API_CACHE_PREFIX + (who || 'anon');
        net2.then(function(response) {
          // Seules les réponses avec le jeton d'une personne sont mémorisées (jamais la clé publique)
          if (uid && response && response.ok) {
            var copy = response.clone();
            caches.open(cacheName).then(function(cache) { cache.put(request, copy); });
          }
        }).catch(function() {});
        return withTimeout(net2, DATA_TIMEOUT_MS).then(function(response) {
          // Jeton expiré hors ligne → refus du serveur : on préfère la dernière copie connue
          if (!uid && response && !response.ok) throw new Error('anon');
          return response;
        }).catch(function() {
          return caches.open(cacheName).then(function(cache) {
            return cache.match(request).then(function(cached) {
              if (cached) return cached;
              // Jamais de fausse réponse vide : une erreur claire « hors connexion », que l'appli sait gérer.
              return new Response(JSON.stringify({ message: 'Hors connexion', code: 'OFFLINE' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } });
            });
          });
        });
      })
    );
    return;
  }

  // Fichiers de l'appli (même adresse) : mémoire d'abord, sinon réseau puis mise en mémoire.
  if (url.origin === self.location.origin) {
    var p = url.pathname;
    // Toujours le réseau : numéro de version, audios/PDF lourds, morceaux demandés par plages (lecture audio)
    if (p === '/version.json' || p.indexOf('/audio/') === 0 || p.indexOf('/pdf/') === 0 ||
        request.headers.has('range') || request.destination === 'audio' || request.destination === 'video') return;
    event.respondWith(
      fromCache(request).then(function(cached) {
        var network = fetch(request).then(function(response) {
          if (response && response.ok && response.type === 'basic') {
            var copy = response.clone();
            caches.open(RUNTIME_CACHE).then(function(cache) { cache.put(request, copy); });
          }
          return response;
        });
        if (cached) {
          // Hors /assets/ (icônes, manifeste…) : rafraîchi en arrière-plan pour la prochaine fois
          if (p.indexOf('/assets/') !== 0) network.catch(function() {});
          return cached;
        }
        return network.catch(function() { return Response.error(); });
      })
    );
  }
  // Autres adresses (stockage Supabase, YouTube…) : le navigateur s'en occupe normalement.
});

// ============ NOTIFICATIONS PUSH ============

// Push notification handler (VAPID Web Push)
self.addEventListener('push', function(event) {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'Dinislam', body: event.data.text() };
  }

  const title = payload.title || 'Dinislam';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || 'dini-bismillah',
    data: payload.data || {},
    vibrate: payload.vibrate || [200, 100, 200],
    // Réglage « Silencieux (vibration seulement) » de l'élève
    silent: payload.silent === true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler — navigate to the URL from notification data
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const url = event.notification.data?.url || '/';
  const fullUrl = self.location.origin + url;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        for (const client of clientList) {
          if (client.url.startsWith(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({ type: 'NAVIGATE', url });
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(fullUrl);
        }
      })
  );
});
