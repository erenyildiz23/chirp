-- Clients may only send the columns the app actually writes. Timestamps,
-- counters and is_reply are always set by the database, so nobody can pin a
-- post to the top of feeds with a future created_at or fake like counts.

revoke insert on public.posts from authenticated;
grant insert (author_id, content, image_path, reply_to_id) on public.posts to authenticated;

revoke insert on public.likes from authenticated;
grant insert (user_id, post_id) on public.likes to authenticated;

revoke insert on public.reposts from authenticated;
grant insert (user_id, post_id) on public.reposts to authenticated;

revoke insert on public.follows from authenticated;
grant insert (follower_id, followee_id) on public.follows to authenticated;
