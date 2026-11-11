-- 2026-11-11 — Demande de Nadia : messages de convocation avec une frise de la saison en haut et en bas
-- ({frise} = 🪵🍂🪵🍂… en automne, ❄️⛄… en hiver, 🌸🐰… au printemps, ☀️🐚… en été ; {saison} = 🍂 ❄️ 🌸 ☀️). Pas trop chargé.
update public.convocation_modeles set texte = E'{frise}\nSalam {prénom} {saison}\nTu as cours {jour} à {heure} ({groupe}).\nÀ très vite in shaa Allah 🤲\n{frise}'
  where id = '05f11603-a024-4e32-a8cc-be83ce90e6bd';
update public.convocation_modeles set texte = E'{frise}\nSalam {prénom} {saison}\nLe cours de {jour} à {heure} ({groupe}) est annulé.\nOn se retrouve la semaine suivante in shaa Allah.\n{frise}'
  where id = '5fbfc014-b757-4386-8542-92f50d9c1c75';
update public.convocation_modeles set texte = E'{frise}\nSalam {prénom} {saison}\nUn cours de rattrapage est prévu {jour} à {heure}.\nMerci de prévenir si tu ne peux pas venir.\n{frise}'
  where id = '4fb6352c-b765-4dd6-ab24-9e5d07f9ff57';
update public.convocation_modeles set texte = E'{frise}\nSalam {prénom} {saison}\nN''oublie pas ton cahier et ta trousse pour le cours de {jour} à {heure} 📚\n{frise}'
  where id = '57073967-e791-44b9-a085-4e40198533df';
