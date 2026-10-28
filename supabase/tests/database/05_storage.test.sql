begin;
\ir _helpers.psql

select plan(6);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

select is((select public from storage.buckets where id = 'avatars'), true, 'avatars bucket is public');
select is((select public from storage.buckets where id = 'post-images'), true, 'post-images bucket is public');
select is((select file_size_limit from storage.buckets where id = 'post-images'), 5242880::bigint,
          'post images are limited to 5 MB');
select set_eq(
  $$select unnest(allowed_mime_types) from storage.buckets where id = 'avatars'$$,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  'only images are allowed');

select tests.authenticate_as(:'alice');
select lives_ok(
  format('insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)',
         'post-images', :'alice' || '/x.png', :'alice'),
  'users can upload into their own folder');
select throws_ok(
  format('insert into storage.objects (bucket_id, name, owner_id) values (%L, %L, %L)',
         'post-images', :'bob' || '/x.png', :'alice'),
  '42501', null, 'users cannot upload into someone else''s folder');

select * from finish();
rollback;
