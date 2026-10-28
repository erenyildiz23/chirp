begin;
\ir _helpers.psql

select plan(12);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

insert into public.posts (author_id, content) values (:'alice', 'alice post') returning id as p \gset

select tests.authenticate_as(:'bob');

-- counters
insert into public.likes (user_id, post_id) values (:'bob', :p);
select is((select like_count from public.posts where id = :p), 1, 'like increments like_count');
delete from public.likes where user_id = :'bob' and post_id = :p;
select is((select like_count from public.posts where id = :p), 0, 'unlike decrements like_count');

insert into public.reposts (user_id, post_id) values (:'bob', :p);
select is((select repost_count from public.posts where id = :p), 1, 'repost increments repost_count');
delete from public.reposts where user_id = :'bob' and post_id = :p;
select is((select repost_count from public.posts where id = :p), 0, 'un-repost decrements repost_count');

insert into public.posts (author_id, content, reply_to_id) values (:'bob', 'reply', :p) returning id as r \gset
select is((select reply_count from public.posts where id = :p), 1, 'reply increments reply_count');
delete from public.posts where id = :r;
select is((select reply_count from public.posts where id = :p), 0, 'deleting a reply decrements reply_count');

-- notifications (checked as postgres so RLS doesn't hide anything)
select tests.clear_auth();
delete from public.notifications;
select tests.authenticate_as(:'bob');
insert into public.likes (user_id, post_id) values (:'bob', :p);
insert into public.reposts (user_id, post_id) values (:'bob', :p);
insert into public.posts (author_id, content, reply_to_id) values (:'bob', 'reply 2', :p) returning id as r2 \gset
insert into public.follows (follower_id, followee_id) values (:'bob', :'alice');
select tests.clear_auth();

select is((select count(*) from public.notifications where recipient_id = :'alice'), 4::bigint,
          'alice gets one notification per action');
select set_eq(
  format('select type::text from public.notifications where recipient_id = %L', :'alice'),
  array['follow', 'like', 'repost', 'reply'],
  'notification types are follow, like, repost, reply');
select is((select count(*) from public.notifications where recipient_id = :'alice' and actor_id <> :'bob'), 0::bigint,
          'bob is the actor of every notification');
select is((select post_id from public.notifications where recipient_id = :'alice' and type = 'reply'), :r2::bigint,
          'reply notification points at the reply');

select tests.authenticate_as(:'alice');
insert into public.likes (user_id, post_id) values (:'alice', :p);
select tests.clear_auth();
select is((select count(*) from public.notifications where actor_id = :'alice'), 0::bigint,
          'liking your own post creates no notification');

select tests.authenticate_as(:'bob');
delete from public.likes where user_id = :'bob' and post_id = :p;
select tests.clear_auth();
select is((select count(*) from public.notifications where recipient_id = :'alice' and type = 'like'), 1::bigint,
          'unlike keeps the like notification');

select * from finish();
rollback;
