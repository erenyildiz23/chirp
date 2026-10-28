-- Core schema: profiles, posts, likes, reposts, follows, notifications.

create extension if not exists unaccent with schema extensions;

-- profiles -------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique
    constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,15}$'),
  display_name text not null
    constraint profiles_display_name_length check (char_length(display_name) between 1 and 50),
  bio text
    constraint profiles_bio_length check (char_length(bio) <= 160),
  avatar_url text,
  created_at timestamptz not null default now()
);

-- posts ----------------------------------------------------------------------

create table public.posts (
  id bigint generated always as identity primary key,
  author_id uuid not null references public.profiles (id) on delete cascade,
  content text
    constraint posts_content_length check (char_length(content) <= 280),
  image_path text,
  reply_to_id bigint references public.posts (id) on delete set null,
  is_reply boolean not null default false,
  like_count integer not null default 0,
  repost_count integer not null default 0,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  constraint posts_has_body check (
    (content is not null and btrim(content) <> '') or image_path is not null
  )
);

create index posts_author_created_idx on public.posts (author_id, created_at desc);
create index posts_reply_to_created_idx on public.posts (reply_to_id, created_at);

-- A reply stays a reply even after its parent is deleted (reply_to_id -> null).
create function public.set_is_reply()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.is_reply := new.reply_to_id is not null;
  return new;
end;
$$;

create trigger posts_set_is_reply
  before insert on public.posts
  for each row execute function public.set_is_reply();

-- likes / reposts / follows --------------------------------------------------

create table public.likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index likes_post_idx on public.likes (post_id);

create table public.reposts (
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id bigint not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index reposts_post_idx on public.reposts (post_id);

create table public.follows (
  follower_id uuid not null references public.profiles (id) on delete cascade,
  followee_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self check (follower_id <> followee_id)
);

create index follows_followee_idx on public.follows (followee_id);

-- notifications --------------------------------------------------------------

create type public.notification_type as enum ('follow', 'like', 'repost', 'reply');

create table public.notifications (
  id bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  post_id bigint references public.posts (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

-- usernames ------------------------------------------------------------------

-- Turns any string (signup input, GitHub login, email local part) into a valid,
-- unused username matching ^[a-z0-9_]{3,15}$.
create function public.generate_username(base text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base text;
  v_candidate text;
  v_n integer := 0;
begin
  v_base := lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(base, '')));
  v_base := regexp_replace(v_base, '[^a-z0-9_]+', '_', 'g');
  v_base := regexp_replace(v_base, '_+', '_', 'g');
  v_base := trim(both '_' from v_base);
  if v_base = '' then
    v_base := 'user';
  end if;
  v_base := left(v_base, 15);
  if length(v_base) < 3 then
    v_base := v_base || '_user';
  end if;

  v_candidate := v_base;
  while exists (select 1 from public.profiles where username = v_candidate) loop
    v_n := v_n + 1;
    v_candidate := left(v_base, 15 - length(v_n::text)) || v_n::text;
  end loop;
  return v_candidate;
end;
$$;

revoke execute on function public.generate_username(text) from public, anon, authenticated;

-- Creates the profile row for every new auth user (email signup or OAuth).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_username text;
begin
  v_username := public.generate_username(coalesce(
    nullif(v_meta ->> 'username', ''),
    nullif(v_meta ->> 'user_name', ''),
    split_part(new.email, '@', 1)
  ));

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    v_username,
    left(coalesce(
      nullif(btrim(v_meta ->> 'display_name'), ''),
      nullif(btrim(v_meta ->> 'full_name'), ''),
      nullif(btrim(v_meta ->> 'name'), ''),
      v_username
    ), 50),
    v_meta ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
