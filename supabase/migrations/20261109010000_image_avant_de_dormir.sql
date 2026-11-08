-- 2026-11-09 : « Avant de dormir » reprend l'image de l'ancienne carte « Lorsqu'on se couche » (mise à la corbeille le 08/11)
update public.invocations set image_url = 'https://zgnxqhfcmdonvdxqpekl.supabase.co/storage/v1/object/public/invocation-content/invocation-icons/2.webp' where id = 10 and image_url is null;
