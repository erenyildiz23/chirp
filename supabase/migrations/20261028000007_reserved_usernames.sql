-- Profiles live at /<username>, so names that collide with app routes are reserved.
-- Keep this list in sync with src/lib/validation/reserved.ts.

create function public.is_reserved_username(p_username text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select p_username = any (array[
    'about', 'admin', 'api', 'auth', 'chirp', 'explore', 'followers', 'following', 'help',
    'home', 'login', 'logout', 'messages', 'notifications', 'privacy', 'search', 'settings',
    'signup', 'status', 'terms'
  ]);
$$;

alter table public.profiles
  add constraint profiles_username_not_reserved check (not public.is_reserved_username(username));

create or replace function public.generate_username(base text)
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
  while public.is_reserved_username(v_candidate)
        or exists (select 1 from public.profiles where username = v_candidate) loop
    v_n := v_n + 1;
    v_candidate := left(v_base, 15 - length(v_n::text)) || v_n::text;
  end loop;
  return v_candidate;
end;
$$;
