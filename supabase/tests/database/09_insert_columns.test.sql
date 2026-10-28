begin;
\ir _helpers.psql

select plan(5);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
insert into public.posts (author_id, content) values (:'bob', 'bob post') returning id as bob_post \gset

select tests.authenticate_as(:'alice');

select throws_ok(
  format('insert into public.posts (author_id, content, created_at) values (%L, %L, %L)', :'alice', 'future', '2099-01-01'),
  '42501', null, 'clients cannot backdate or future-date posts');
select throws_ok(
  format('insert into public.posts (author_id, content, like_count) values (%L, %L, 999999)', :'alice', 'popular'),
  '42501', null, 'clients cannot set counters');
select throws_ok(
  format('insert into public.reposts (user_id, post_id, created_at) values (%L, %s, %L)', :'alice', :bob_post, '2099-01-01'),
  '42501', null, 'clients cannot date reposts');
select throws_ok(
  format('insert into public.follows (follower_id, followee_id, created_at) values (%L, %L, %L)', :'alice', :'bob', '2099-01-01'),
  '42501', null, 'clients cannot date follows');
select lives_ok(
  format('insert into public.posts (author_id, content, image_path, reply_to_id) values (%L, %L, null, %s)', :'alice', 'ok', :bob_post),
  'the columns the app sends are still allowed');

select * from finish();
rollback;
