begin;
\ir _helpers.psql

select plan(6);

-- Trigger functions must not be reachable through /rest/v1/rpc.
select is(
  (select count(*)::int
   from pg_proc p
   where p.pronamespace = 'public'::regnamespace
     and p.prorettype = 'trigger'::regtype
     and (has_function_privilege('anon', p.oid, 'execute')
          or has_function_privilege('authenticated', p.oid, 'execute'))),
  0, 'no trigger function is executable by anon or authenticated');
select ok(not has_function_privilege('anon', 'public.handle_new_user()', 'execute'), 'anon cannot call handle_new_user');
select ok(not has_function_privilege('authenticated', 'public.protect_demo_auth()', 'execute'),
          'authenticated cannot call protect_demo_auth');

-- The app's RPCs stay callable.
select ok(has_function_privilege('authenticated', 'public.home_feed(timestamptz, text, integer)', 'execute'),
          'home_feed is still callable');

-- Foreign keys used by cascading deletes are indexed.
select has_index('public', 'notifications', 'notifications_actor_idx', 'notifications.actor_id is indexed');
select has_index('public', 'notifications', 'notifications_post_idx', 'notifications.post_id is indexed');

select * from finish();
rollback;
