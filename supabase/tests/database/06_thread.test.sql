begin;
\ir _helpers.psql

select plan(4);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob') as bob \gset

insert into public.posts (author_id, content, created_at) values (:'alice', 'P', now() - interval '3 hours') returning id as p \gset
insert into public.posts (author_id, content, reply_to_id, created_at)
  values (:'bob', 'R1', :p, now() - interval '2 hours') returning id as r1 \gset
insert into public.posts (author_id, content, reply_to_id, created_at)
  values (:'alice', 'R2', :p, now() - interval '1 hour') returning id as r2 \gset

select tests.authenticate_as(:'bob');

select results_eq(
  format('select content from public.post_thread_items(%s)', :r1),
  array['P', 'R1'],
  'a reply comes with its parent first');
select results_eq(
  format('select content from public.post_thread_items(%s)', :p),
  array['P', 'R1', 'R2'],
  'a post comes with its replies, oldest first');
select is(
  (select count(*) from public.post_thread_items(999999999)),
  0::bigint, 'an unknown post returns nothing');

select tests.clear_auth();
delete from public.posts where id = :p;
select tests.authenticate_as(:'bob');
select results_eq(
  format('select content from public.post_thread_items(%s)', :r1),
  array['R1'],
  'a reply whose parent was deleted comes alone');

select * from finish();
rollback;
