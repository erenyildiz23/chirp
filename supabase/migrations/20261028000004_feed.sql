-- Feed assembly: one row type shared by every list of posts in the app.

create type public.feed_item as (
  item_key text,
  activity_at timestamptz,
  post_id bigint,
  content text,
  image_path text,
  is_reply boolean,
  reply_to_id bigint,
  reply_to_username text,
  like_count integer,
  repost_count integer,
  reply_count integer,
  created_at timestamptz,
  author_id uuid,
  author_username text,
  author_display_name text,
  author_avatar_url text,
  reposted_by_username text,
  reposted_by_display_name text,
  liked_by_me boolean,
  reposted_by_me boolean
);

-- Turns one (post, optional reposter) pair into a fully populated feed_item.
create function public.to_feed_item(
  p_item_key text,
  p_activity_at timestamptz,
  p_post_id bigint,
  p_reposter_id uuid
)
returns public.feed_item
language sql
stable
security invoker
set search_path = ''
as $$
  select row(
    p_item_key,
    p_activity_at,
    p.id,
    p.content,
    p.image_path,
    p.is_reply,
    p.reply_to_id,
    parent_author.username,
    p.like_count,
    p.repost_count,
    p.reply_count,
    p.created_at,
    a.id,
    a.username,
    a.display_name,
    a.avatar_url,
    rb.username,
    rb.display_name,
    exists (select 1 from public.likes l where l.post_id = p.id and l.user_id = (select auth.uid())),
    exists (select 1 from public.reposts r where r.post_id = p.id and r.user_id = (select auth.uid()))
  )::public.feed_item
  from public.posts p
  join public.profiles a on a.id = p.author_id
  left join public.posts parent on parent.id = p.reply_to_id
  left join public.profiles parent_author on parent_author.id = parent.author_id
  left join public.profiles rb on rb.id = p_reposter_id
  where p.id = p_post_id;
$$;

-- Home feed: own posts, followed users' posts and followed users' reposts.
-- Replies are excluded. A post reached through several paths shows once, at its
-- most recent activity. Keyset pagination on (activity_at, item_key).
create function public.home_feed(
  p_cursor_at timestamptz default null,
  p_cursor_key text default null,
  p_limit integer default 20
)
returns setof public.feed_item
language sql
stable
security invoker
set search_path = ''
as $$
  with followed as (
    select f.followee_id as id from public.follows f where f.follower_id = (select auth.uid())
  ),
  items as (
    select 'p:' || p.id as item_key, p.created_at as activity_at, p.id as post_id, null::uuid as reposter_id
    from public.posts p
    where not p.is_reply
      and (p.author_id = (select auth.uid()) or p.author_id in (select id from followed))
    union all
    select 'r:' || r.user_id || ':' || r.post_id, r.created_at, r.post_id, r.user_id
    from public.reposts r
    where r.user_id in (select id from followed)
  ),
  latest as (
    select distinct on (post_id) *
    from items
    order by post_id, activity_at desc, item_key desc
  ),
  page as (
    select *
    from latest
    where p_cursor_at is null or (activity_at, item_key) < (p_cursor_at, p_cursor_key)
    order by activity_at desc, item_key desc
    limit p_limit
  )
  select (public.to_feed_item(item_key, activity_at, post_id, reposter_id)).*
  from page
  order by activity_at desc, item_key desc;
$$;

-- Profile timeline: tab 'posts' = the user's posts and reposts, tab 'replies' = the user's replies.
create function public.profile_timeline(
  p_username text,
  p_tab text,
  p_cursor_at timestamptz default null,
  p_cursor_key text default null,
  p_limit integer default 20
)
returns setof public.feed_item
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user uuid;
begin
  if p_tab not in ('posts', 'replies') then
    raise exception 'unknown timeline tab: %', p_tab;
  end if;

  select id into v_user from public.profiles where username = p_username;
  if v_user is null then
    return;
  end if;

  return query
  with items as (
    select 'p:' || p.id as item_key, p.created_at as activity_at, p.id as post_id, null::uuid as reposter_id
    from public.posts p
    where p.author_id = v_user and p.is_reply = (p_tab = 'replies')
    union all
    select 'r:' || r.user_id || ':' || r.post_id, r.created_at, r.post_id, r.user_id
    from public.reposts r
    where p_tab = 'posts' and r.user_id = v_user
  ),
  latest as (
    select distinct on (post_id) *
    from items
    order by post_id, activity_at desc, item_key desc
  ),
  page as (
    select *
    from latest
    where p_cursor_at is null or (activity_at, item_key) < (p_cursor_at, p_cursor_key)
    order by activity_at desc, item_key desc
    limit p_limit
  )
  select (public.to_feed_item(page.item_key, page.activity_at, page.post_id, page.reposter_id)).*
  from page
  order by page.activity_at desc, page.item_key desc;
end;
$$;
