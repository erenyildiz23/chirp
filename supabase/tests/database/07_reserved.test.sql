begin;
\ir _helpers.psql

select plan(4);

select tests.create_user('alice') as alice \gset

select throws_ok(
  format('update public.profiles set username = %L where id = %L', 'settings', :'alice'),
  '23514', null, 'reserved usernames are rejected');
select is(public.generate_username('home'), 'home1', 'generated usernames skip reserved names');

-- a GitHub user called "search" still gets a profile
select tests.create_user('search') as searcher \gset
select is((select username from public.profiles where id = :'searcher'), 'search1',
          'signing up with a reserved name gets a suffix instead of failing');
select is(public.generate_username('alice'), 'alice1', 'normal names still work');

select * from finish();
rollback;
