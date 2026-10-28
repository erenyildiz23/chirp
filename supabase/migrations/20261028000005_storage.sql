-- Public image buckets; users write only inside a folder named after their user id.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "images are public"
  on storage.objects for select
  using (bucket_id in ('avatars', 'post-images'));

create policy "users upload into their own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id in ('avatars', 'post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users update their own images"
  on storage.objects for update to authenticated
  using (
    bucket_id in ('avatars', 'post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "users delete their own images"
  on storage.objects for delete to authenticated
  using (
    bucket_id in ('avatars', 'post-images')
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
