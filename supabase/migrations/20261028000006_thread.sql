-- Post detail: the parent (if any), the post itself, then its replies oldest first.

create function public.post_thread_items(p_post_id bigint)
returns setof public.feed_item
language sql
stable
security invoker
set search_path = ''
as $$
  with target as (
    select id, reply_to_id from public.posts where id = p_post_id
  ),
  items as (
    select parent.id as post_id, parent.created_at, 0 as part
    from target join public.posts parent on parent.id = target.reply_to_id
    union all
    select p.id, p.created_at, 1 from target join public.posts p on p.id = target.id
    union all
    select r.id, r.created_at, 2 from target join public.posts r on r.reply_to_id = target.id
  )
  select (public.to_feed_item('p:' || post_id, created_at, post_id, null)).*
  from items
  order by part, created_at, post_id;
$$;
