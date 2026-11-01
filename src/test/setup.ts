import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Node récent fournit son propre « localStorage » incomplet (sans getItem) qui masque celui du navigateur simulé :
// Supabase plantait alors en arrière-plan pendant les tests (« storage.getItem is not a function »). On met une mémoire simple.
function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() { return data.size; },
    clear: () => data.clear(),
    getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    removeItem: (k: string) => { data.delete(k); },
    setItem: (k: string, v: string) => { data.set(k, String(v)); },
  };
}
for (const name of ["localStorage", "sessionStorage"] as const) {
  const current = (globalThis as Record<string, unknown>)[name] as Storage | undefined;
  if (!current || typeof current.getItem !== "function") {
    const store = memoryStorage();
    Object.defineProperty(globalThis, name, { configurable: true, value: store });
    Object.defineProperty(window, name, { configurable: true, value: store });
  }
}
