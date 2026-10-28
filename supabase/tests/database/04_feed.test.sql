begin;
\ir _helpers.psql

select plan(16);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset
select tests.create_user('carol') as carol \gset

insert into public.follows (follower_id, followee_id) values (:'alice', :'bob');

insert into public.posts (author_id, content, created_at) values (:'alice', 'A1', now() - interval '1 hour') returning id as a1 \gset
insert into public.posts (author_id, content, created_at) values (:'bob', 'B1', now() - interval '2 hours') returning id as b1 \gset
insert into public.posts (author_id, content, created_at) values (:'carol', 'C1', now() - interval '3 hours') returning id as c1 \gset
insert into public.reposts (user_id, post_id, created_at) values (:'bob', :c1, now() - interval '30 minutes');
insert into public.posts (author_id, content, reply_to_id, created_at)
  values (:'bob', 'BR', :c1, now() - interval '10 minutes') returning id as br \gset

-- Pages through home_feed and returns every item_key in order.
create function tests.all_feed_keys(p_limit int)
returns text[]
language plpgsql
as $$
declare
  v_keys text[] := '{}';
  v_at timestamptz;
  v_key text;
  v_page public.feed_item[];
begin
  loop
    select array_agg(f) into v_page from public.home_feed(v_at, v_key, p_limit) f;
    exit when v_page is null;
    v_keys := v_keys || array(select (x).item_key from unnest(v_page) x);
    v_at := v_page[array_length(v_page, 1)].activity_at;
    v_key := v_page[array_length(v_page, 1)].item_key;
  end loop;
  return v_keys;
end;
$$;

select tests.authenticate_as(:'alice');

select results_eq(
  'select content from public.home_feed()',
  array['C1', 'A1', 'B1'],
  'feed has followed repost, own post and followed post, newest activity first');
select is(
  (select reposted_by_username from public.home_feed() where post_id = :c1),
  'bob', 'repost rows carry the reposter');
select is(
  (select count(*) from public.home_feed() where post_id = :br),
  0::bigint, 'replies are not in the home feed');
select is(
  (select item_key from public.home_feed() where post_id = :c1),
  'r:' || :'bob' || ':' || :c1, 'repost item key format');
select is(
  (select item_key from public.home_feed() where post_id = :a1),
  'p:' || :a1, 'post item key format');

-- liked_by_me / reposted_by_me
insert into public.likes (user_id, post_id) values (:'alice', :b1);
select is(
  (select array_agg(post_id order by post_id) from public.home_feed() where liked_by_me),
  array[:b1::bigint], 'liked_by_me is true only for posts alice liked');
select is(
  (select bool_or(reposted_by_me) from public.home_feed()),
  false, 'alice has reposted nothing');

-- dedup: bob reposts alice's own post
select tests.clear_auth();
insert into public.reposts (user_id, post_id, created_at) values (:'bob', :a1, now() - interval '5 minutes');
select tests.authenticate_as(:'alice');
select is(
  (select count(*) from public.home_feed() where post_id = :a1),
  1::bigint, 'a post that is also reposted appears once');
select is(
  (select item_key from public.home_feed() where post_id = :a1),
  'r:' || :'bob' || ':' || :a1, 'the most recent activity (the repost) wins');

-- pagination with equal timestamps
select tests.clear_auth();
insert into public.posts (author_id, content, created_at)
select :'bob', 'tie ' || i, timestamptz '2026-01-01 00:00:00+00' from generate_series(1, 5) i;
select tests.authenticate_as(:'alice');
select is(
  (select cardinality(tests.all_feed_keys(2))),
  (select count(*)::int from public.home_feed(null, null, 100)),
  'paging by 2 returns every item');
select is(
  (select count(distinct k)::int from unnest(tests.all_feed_keys(2)) k),
  (select count(*)::int from public.home_feed(null, null, 100)),
  'paging by 2 never duplicates an item');

-- deleting a reposted post removes the repost row
select tests.clear_auth();
delete from public.posts where id = :c1;
select tests.authenticate_as(:'alice');
select is(
  (select count(*) from public.home_feed() where post_id = :c1),
  0::bigint, 'reposts of a deleted post disappear');

-- profile timeline
select results_eq(
  format('select content from public.profile_timeline(%L, %L)', 'bob', 'replies'),
  array['BR'], 'replies tab has only replies');
select is(
  (select is_reply and reply_to_id is null from public.profile_timeline('bob', 'replies')),
  true, 'a reply to a deleted post is still listed as a reply');
select ok(
  (select bool_and(not is_reply) from public.profile_timeline('bob', 'posts')),
  'posts tab has no replies');
select throws_ok(
  format('select * from public.profile_timeline(%L, %L)', 'bob', 'likes'),
  'P0001', null, 'unknown tab is rejected');

select * from finish();
rollback;
