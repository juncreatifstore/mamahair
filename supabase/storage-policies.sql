-- ============================================================
--  MAMAHAIR — Supabase Storage : buckets et policies
--  À exécuter dans Supabase → SQL Editor (une seule fois).
--  Les uploads passent TOUJOURS par le serveur (service_role) :
--  aucune policy d'écriture n'est donnée aux clients.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('products', 'products', true,  5242880, array['image/jpeg','image/png','image/webp','image/avif']),
  ('reviews',  'reviews',  true,  3145728, array['image/jpeg','image/png','image/webp','image/avif']),
  ('branding', 'branding', true,  6291456, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/x-icon'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Lecture publique (les images sont servies par URL publique)
drop policy if exists "Public read products" on storage.objects;
create policy "Public read products" on storage.objects for select using (bucket_id = 'products');
drop policy if exists "Public read reviews" on storage.objects;
create policy "Public read reviews" on storage.objects for select using (bucket_id = 'reviews');
drop policy if exists "Public read branding" on storage.objects;
create policy "Public read branding" on storage.objects for select using (bucket_id = 'branding');

-- Aucune policy insert/update/delete pour anon/authenticated :
-- seules les Server Actions (service_role, qui contourne RLS) peuvent écrire.
