-- Row level security and table privileges.
-- Everything is publicly readable except notifications; every write is limited
-- to the signed-in user's own rows.

alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.reposts enable row level security;
alter table public.follows enable row level security;
alter table public.notifications enable row level security;

-- Anonymous visitors only read.
revoke insert, update, delete, truncate on all tables in schema public from anon;

-- Column-level write privileges for signed-in users.
revoke update on public.profiles from authenticated;
grant update (username, display_name, bio, avatar_url) on public.profiles to authenticated;

revoke update on public.posts from authenticated;
revoke update on public.likes, public.reposts, public.follows from authenticated;

revoke insert, update, delete on public.notifications from authenticated;
grant update (read_at) on public.notifications to authenticated;

-- profiles
create policy "profiles are public"
  on public.profiles for select using (true);
create policy "users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- posts
create policy "posts are public"
  on public.posts for select using (true);
create policy "users create their own posts"
  on public.posts for insert to authenticated
  with check (author_id = (select auth.uid()));
create policy "users delete their own posts"
  on public.posts for delete to authenticated
  using (author_id = (select auth.uid()));

-- likes
create policy "likes are public"
  on public.likes for select using (true);
create policy "users like as themselves"
  on public.likes for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users remove their own likes"
  on public.likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- reposts
create policy "reposts are public"
  on public.reposts for select using (true);
create policy "users repost as themselves"
  on public.reposts for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "users remove their own reposts"
  on public.reposts for delete to authenticated
  using (user_id = (select auth.uid()));

-- follows
create policy "follows are public"
  on public.follows for select using (true);
create policy "users follow as themselves"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy "users unfollow as themselves"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

-- notifications (inserted only by security definer triggers)
create policy "users read their own notifications"
  on public.notifications for select to authenticated
  using (recipient_id = (select auth.uid()));
create policy "users mark their own notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = (select auth.uid())) with check (recipient_id = (select auth.uid()));
