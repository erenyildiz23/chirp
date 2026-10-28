begin;
\ir _helpers.psql

select plan(22);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'posts', 'posts table exists');
select has_table('public', 'likes', 'likes table exists');
select has_table('public', 'reposts', 'reposts table exists');
select has_table('public', 'follows', 'follows table exists');
select has_table('public', 'notifications', 'notifications table exists');

-- profile trigger
select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

select is((select username from public.profiles where id = :'alice'), 'alice',
          'signing up creates a profile with the requested username');
select is((select display_name from public.profiles where id = :'alice'), 'alice',
          'display name comes from metadata');

-- username generation
select is(public.generate_username('Eren-Yıldız'), 'eren_yildiz', 'transliterates and replaces invalid chars');
select matches(public.generate_username('ab'), '^[a-z0-9_]{3,15}$', 'short names are padded to a valid username');
select is(length(public.generate_username('a_very_long_github_login_name')), 15, 'long names are truncated to 15');
select is(public.generate_username('alice'), 'alice1', 'taken names get the smallest numeric suffix');

-- constraints
select throws_ok(
  format('insert into public.follows (follower_id, followee_id) values (%L, %L)', :'alice', :'alice'),
  '23514', null, 'cannot follow yourself');

insert into public.posts (author_id, content) values (:'alice', 'hello') returning id as p1 \gset
insert into public.likes (user_id, post_id) values (:'bob', :p1);
select throws_ok(
  format('insert into public.likes (user_id, post_id) values (%L, %s)', :'bob', :p1),
  '23505', null, 'cannot like the same post twice');

select throws_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'alice', '   '),
  '23514', null, 'whitespace-only post without image is rejected');
select throws_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'alice', repeat('a', 281)),
  '23514', null, '281 characters is rejected');
select lives_ok(
  format('insert into public.posts (author_id, content) values (%L, %L)', :'alice', repeat('😀', 280)),
  '280 emoji is accepted');

select throws_ok(
  format('update public.profiles set username = %L where id = %L', 'Bad Name', :'alice'),
  '23514', null, 'invalid username is rejected');
select throws_ok(
  format('update public.profiles set username = %L where id = %L', 'bob', :'alice'),
  '23505', null, 'duplicate username is rejected');

-- is_reply
insert into public.posts (author_id, content, reply_to_id, is_reply)
values (:'bob', 'a reply', :p1, false) returning id as r1 \gset
select is((select is_reply from public.posts where id = :r1), true, 'replies are stored with is_reply = true');

delete from public.posts where id = :p1;
select is((select reply_to_id from public.posts where id = :r1), null::bigint, 'deleting the parent nulls reply_to_id');
select is((select is_reply from public.posts where id = :r1), true, 'reply stays a reply after parent deletion');

select * from finish();
rollback;
