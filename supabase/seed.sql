-- Local development data. Every account's password is "password123".
-- Never run this against production (see scripts/seed-demo.ts instead).

do $$
declare
  v_users text[][] := array[
    ['demo', 'Demo User', 'Just trying out Chirp.'],
    ['ada', 'Ada Lovelace', 'First programmer. Big fan of engines.'],
    ['linus', 'Linus', 'Talk is cheap. Show me the code.'],
    ['grace', 'Grace Hopper', 'It''s easier to ask forgiveness than permission.'],
    ['margaret', 'Margaret Hamilton', 'Software engineering, before it had a name.']
  ];
  v_contents text[] := array[
    'Hello Chirp! 👋',
    'Shipping on a Friday is a lifestyle choice.',
    'Rewrote my old PHP project in Next.js today.',
    'Row level security is underrated.',
    'Coffee count: 3. Bugs fixed: 1.',
    'Reading about keyset pagination. Offsets are a trap.',
    'Dark mode or no mode.',
    'Tests are documentation that can fail.',
    'Today I learned: Postgres triggers can do a lot.',
    'Who else names variables after snacks?'
  ];
  v_ids uuid[] := '{}';
  v_id uuid;
  v_post bigint;
  v_posts bigint[] := '{}';
  i int;
begin
  for i in 1 .. array_length(v_users, 1) loop
    v_id := gen_random_uuid();
    v_ids := v_ids || v_id;

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_id, 'authenticated', 'authenticated',
      v_users[i][1] || '@chirp.local', extensions.crypt('password123', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('username', v_users[i][1], 'display_name', v_users[i][2]),
      now() - interval '30 days', now(),
      '', '', '', ''
    );

    insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      v_id::text, v_id,
      jsonb_build_object('sub', v_id::text, 'email', v_users[i][1] || '@chirp.local', 'email_verified', true),
      'email', now(), now(), now()
    );

    update public.profiles set bio = v_users[i][3] where id = v_id;
  end loop;

  -- 30 posts spread over the last 7 days
  for i in 1 .. 30 loop
    insert into public.posts (author_id, content, created_at)
    values (
      v_ids[1 + (i % 5)],
      v_contents[1 + (i % 10)],
      now() - (i * interval '5 hours 37 minutes')
    )
    returning id into v_post;
    v_posts := v_posts || v_post;
  end loop;

  -- demo follows ada, linus and grace; everyone else follows demo
  insert into public.follows (follower_id, followee_id)
  values (v_ids[1], v_ids[2]), (v_ids[1], v_ids[3]), (v_ids[1], v_ids[4]),
         (v_ids[2], v_ids[1]), (v_ids[3], v_ids[1]), (v_ids[5], v_ids[1]),
         (v_ids[2], v_ids[3]), (v_ids[4], v_ids[5]);

  -- likes and reposts
  for i in 1 .. 20 loop
    insert into public.likes (user_id, post_id) values (v_ids[1 + ((i + 1) % 5)], v_posts[i])
    on conflict do nothing;
  end loop;
  insert into public.reposts (user_id, post_id, created_at)
  values (v_ids[2], v_posts[3], now() - interval '2 hours'),
         (v_ids[3], v_posts[8], now() - interval '6 hours'),
         (v_ids[4], v_posts[12], now() - interval '1 day');

  -- a short reply thread
  insert into public.posts (author_id, content, reply_to_id, created_at)
  values (v_ids[3], 'Same here, it was worth it.', v_posts[2], now() - interval '3 hours'),
         (v_ids[4], 'Which stack did you pick?', v_posts[2], now() - interval '2 hours');
end;
$$;
