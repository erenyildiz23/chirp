begin;
\ir _helpers.psql

select plan(17);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

insert into public.posts (author_id, content) values (:'bob', 'bob post') returning id as bob_post \gset
insert into public.notifications (recipient_id, actor_id, type) values (:'alice', :'bob', 'follow');

select tests.authenticate_as(:'alice');

-- writes as someone else are rejected
select throws_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'bob', 'spoof'),
  '42501', null, 'cannot post as another user');
select throws_ok(
  format('insert into public.likes (user_id, post_id) values (%L, %s)', :'bob', :bob_post),
  '42501', null, 'cannot like as another user');
select throws_ok(
  format('insert into public.reposts (user_id, post_id) values (%L, %s)', :'bob', :bob_post),
  '42501', null, 'cannot repost as another user');
select throws_ok(
  format('insert into public.follows (follower_id, followee_id) values (%L, %L)', :'bob', :'alice'),
  '42501', null, 'cannot follow as another user');
select throws_ok(
  format('insert into public.notifications (recipient_id, actor_id, type) values (%L, %L, %L)', :'bob', :'alice', 'like'),
  '42501', null, 'clients cannot insert notifications');

-- own writes work
select lives_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'alice', 'mine'),
  'can post as yourself');
select lives_ok(
  format('insert into public.likes (user_id, post_id) values (%L, %s)', :'alice', :bob_post),
  'can like as yourself');
select lives_ok(
  format('insert into public.reposts (user_id, post_id) values (%L, %s)', :'alice', :bob_post),
  'can repost as yourself');
select lives_ok(
  format('insert into public.follows (follower_id, followee_id) values (%L, %L)', :'alice', :'bob'),
  'can follow as yourself');

-- updates and deletes are limited to own rows
select is(
  tests.affected(format('update public.profiles set display_name = %L where id = %L', 'hacked', :'bob')),
  0::bigint, 'cannot update another profile');
select is(
  tests.affected(format('update public.profiles set display_name = %L where id = %L', 'Alice', :'alice')),
  1::bigint, 'can update own profile');
select throws_ok(
  format('update public.posts set content = %L where author_id = %L', 'edited', :'alice'),
  '42501', null, 'posts cannot be edited');
select is(
  tests.affected(format('delete from public.posts where id = %s', :bob_post)),
  0::bigint, 'cannot delete another user''s post');
select is(
  tests.affected(format('delete from public.posts where author_id = %L', :'alice')),
  1::bigint, 'can delete own post');

-- notifications are private
select tests.authenticate_as(:'bob');
select is(
  (select count(*) from public.notifications where recipient_id = :'alice'),
  0::bigint, 'cannot read someone else''s notifications');

-- anonymous visitors can read but not write
select tests.clear_auth();
set local role anon;
select ok((select count(*) from public.posts) > 0 and (select count(*) from public.profiles) > 0,
          'anon can read posts and profiles');
select throws_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'alice', 'anon'),
  '42501', null, 'anon cannot post');

select * from finish();
rollback;
