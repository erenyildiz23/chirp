begin;
\ir _helpers.psql

select plan(6);

select tests.create_user('alice') as alice \gset
select tests.create_user('bob_x') as bob \gset
select tests.create_user('bobby') as bobby \gset
update public.profiles set display_name = 'Robert Tables' where id = :'bobby';

insert into public.posts (author_id, content, created_at) values (:'alice', '50% off today', now() - interval '2 hours');
insert into public.posts (author_id, content, created_at) values (:'alice', '500 off today', now() - interval '1 hour');
insert into public.posts (author_id, content) values (:'bob', 'Hello, (world)');

select tests.authenticate_as(:'alice');

select results_eq(
  $$select content from public.search_posts('50%')$$,
  array['50% off today'],
  '% is matched literally');
select results_eq(
  $$select content from public.search_posts('off today')$$,
  array['500 off today', '50% off today'],
  'post results are newest first');
select results_eq(
  $$select content from public.search_posts('(world)')$$,
  array['Hello, (world)'],
  'parentheses and commas are plain text');

select results_eq(
  $$select username from public.search_people('bob_') order by username$$,
  array['bob_x'],
  '_ is matched literally in usernames');
select results_eq(
  $$select username from public.search_people('TABLES')$$,
  array['bobby'],
  'display names match case-insensitively');
select is(
  (select count(*) from public.search_people('   ')),
  0::bigint, 'a blank query returns nobody');

select * from finish();
rollback;
