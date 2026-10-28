-- Denormalized counters on posts and notification fan-out.
-- All functions are security definer: clients cannot update counters or insert
-- notifications themselves (see the RLS migration).

-- counters -------------------------------------------------------------------

create function public.bump_like_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  else
    update public.posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger likes_bump_count
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create function public.bump_repost_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set repost_count = repost_count + 1 where id = new.post_id;
  else
    update public.posts set repost_count = greatest(repost_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger reposts_bump_count
  after insert or delete on public.reposts
  for each row execute function public.bump_repost_count();

create function public.bump_reply_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.reply_to_id is not null then
    update public.posts set reply_count = reply_count + 1 where id = new.reply_to_id;
  elsif tg_op = 'DELETE' and old.reply_to_id is not null then
    update public.posts set reply_count = greatest(reply_count - 1, 0) where id = old.reply_to_id;
  end if;
  return null;
end;
$$;

create trigger posts_bump_reply_count
  after insert or delete on public.posts
  for each row execute function public.bump_reply_count();

-- notifications --------------------------------------------------------------

create function public.notify(
  p_recipient uuid,
  p_actor uuid,
  p_type public.notification_type,
  p_post bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_recipient is not null and p_recipient <> p_actor then
    insert into public.notifications (recipient_id, actor_id, type, post_id)
    values (p_recipient, p_actor, p_type, p_post);
  end if;
end;
$$;

revoke execute on function public.notify(uuid, uuid, public.notification_type, bigint)
  from public, anon, authenticated;

create function public.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(new.followee_id, new.follower_id, 'follow', null);
  return null;
end;
$$;

create trigger follows_notify
  after insert on public.follows
  for each row execute function public.notify_on_follow();

create function public.notify_on_like()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(
    (select author_id from public.posts where id = new.post_id), new.user_id, 'like', new.post_id);
  return null;
end;
$$;

create trigger likes_notify
  after insert on public.likes
  for each row execute function public.notify_on_like();

create function public.notify_on_repost()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.notify(
    (select author_id from public.posts where id = new.post_id), new.user_id, 'repost', new.post_id);
  return null;
end;
$$;

create trigger reposts_notify
  after insert on public.reposts
  for each row execute function public.notify_on_repost();

create function public.notify_on_reply()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reply_to_id is not null then
    perform public.notify(
      (select author_id from public.posts where id = new.reply_to_id), new.author_id, 'reply', new.id);
  end if;
  return null;
end;
$$;

create trigger posts_notify_reply
  after insert on public.posts
  for each row execute function public.notify_on_reply();
