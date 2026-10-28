-- The shared "Try the demo" account must keep working for every visitor, so a
-- demo session cannot change its email, password or username. Clients cannot
-- write is_demo (it is not in the profiles update grant); scripts/seed-demo.ts
-- clears it with the service role to reset the account.

alter table public.profiles add column is_demo boolean not null default false;

create function public.protect_demo_auth()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.profiles where id = old.id and is_demo)
     and (new.email is distinct from old.email
          or new.encrypted_password is distinct from old.encrypted_password
          or new.email_change is distinct from old.email_change) then
    raise exception 'The demo account''s email and password cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_demo_auth
  before update on auth.users
  for each row execute function public.protect_demo_auth();

create function public.protect_demo_profile()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_demo and new.is_demo and new.username is distinct from old.username then
    raise exception 'The demo account''s username cannot be changed';
  end if;
  return new;
end;
$$;

create trigger protect_demo_profile
  before update on public.profiles
  for each row execute function public.protect_demo_profile();
