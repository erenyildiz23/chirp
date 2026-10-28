-- Plain substring search. User input is escaped so %, _ and \ match literally.

create function public.like_pattern(p_query text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%';
$$;

create function public.search_posts(p_query text, p_limit integer default 20)
returns setof public.feed_item
language sql
stable
security invoker
set search_path = ''
as $$
  with hits as (
    select p.id, p.created_at
    from public.posts p
    where btrim(p_query) <> '' and p.content ilike public.like_pattern(p_query)
    order by p.created_at desc, p.id desc
    limit p_limit
  )
  select (public.to_feed_item('p:' || id, created_at, id, null)).*
  from hits
  order by created_at desc, id desc;
$$;

create function public.search_people(p_query text, p_limit integer default 20)
returns setof public.profiles
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.profiles
  where btrim(p_query) <> ''
    and (username ilike public.like_pattern(p_query) or display_name ilike public.like_pattern(p_query))
  order by (lower(username) = lower(btrim(p_query))) desc, username
  limit p_limit;
$$;
