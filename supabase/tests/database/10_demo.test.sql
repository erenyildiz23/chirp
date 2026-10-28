begin;
\ir _helpers.psql

select plan(7);

select tests.create_user('demo') as demo \gset
update public.profiles set is_demo = true where id = :'demo';

-- Auth updates (GoTrue writes auth.users directly)
select throws_ok(
  format('update auth.users set encrypted_password = %L where id = %L', 'hijacked', :'demo'),
  'P0001', null, 'the demo password cannot be changed');
select throws_ok(
  format('update auth.users set email = %L where id = %L', 'me@evil.test', :'demo'),
  'P0001', null, 'the demo email cannot be changed');
select throws_ok(
  format('update auth.users set email_change = %L where id = %L', 'me@evil.test', :'demo'),
  'P0001', null, 'an email change cannot even be requested');
select lives_ok(
  format('update auth.users set last_sign_in_at = now() where id = %L', :'demo'),
  'normal sign-ins still update the user');

-- Profile updates by the demo user
select tests.authenticate_as(:'demo');
select throws_ok(
  format('update public.profiles set username = %L where id = %L', 'gotcha', :'demo'),
  'P0001', null, 'the demo username cannot be changed');
select throws_ok(
  format('update public.profiles set is_demo = false where id = %L', :'demo'),
  '42501', null, 'clients cannot clear the demo flag');

-- The reset script clears the flag with elevated rights first
select tests.clear_auth();
update public.profiles set is_demo = false where id = :'demo';
select lives_ok(
  format('update auth.users set encrypted_password = %L where id = %L', 'reset', :'demo'),
  'with the flag cleared, the password can be reset');

select * from finish();
rollback;
