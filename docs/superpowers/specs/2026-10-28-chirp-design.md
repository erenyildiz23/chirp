# Chirp — Design Spec

Date: 2026-10-28
Status: Approved in conversation, pending written review

## 1. Purpose

Chirp is a rewrite of an old PHP/MySQL Twitter clone (`../www`) on a modern stack. It is a **portfolio project**: it must be deployed with a public demo link, have clean and tested code, and a polished UI that a recruiter can try in one click.

Success criteria:

- Live on Vercel with a working "Try the demo" account.
- All features below work end to end on the deployed site.
- Authorization is enforced in the database (RLS), not only in the UI.
- CI runs lint, typecheck, unit tests and database tests on every push.
- README with screenshots, live link, architecture overview, local setup and a "what changed from the PHP version" section.

Non-goals (v1): quote reposts, hashtags/trends, direct messages, realtime notifications, migrating the old MySQL data.

## 2. Stack

- Next.js 15 (App Router, TypeScript, Server Components, Server Actions)
- Tailwind CSS + shadcn/ui, light/dark theme (system default)
- Supabase: Postgres, Auth (email + password, GitHub OAuth), Storage
- `@supabase/ssr` for cookie-based sessions on the server
- Zod for input validation (shared between client forms and Server Actions)
- Supabase CLI for local development, migrations, type generation and DB tests
- Tests: Vitest (unit), pgTAP via `supabase test db` (database), Playwright (end to end)
- Hosting: Vercel (app) + Supabase Cloud (database)
- UI language: English

Repository: new git repo in `chirp/` next to the legacy `www/` folder. The legacy code is kept only as reference.

## 3. Architecture

- **Reads:** pages are Server Components that query Supabase with the user's session on the server.
- **Writes:** every mutation (create/delete post, like, repost, follow, update profile) is a Server Action. Each action validates input with Zod, calls Supabase, then calls `revalidatePath` for affected pages.
- **Action result shape:** `{ ok: true, data } | { ok: false, error: string, fieldErrors?: Record<string, string> }`. Actions never throw to the client.
- **Interactive buttons:** like, repost and follow buttons are small client components using `useOptimistic`; on failure they revert and show a toast.
- **Session:** `middleware.ts` refreshes the Supabase session on each request and redirects unauthenticated users away from protected routes (`/home`, `/notifications`, `/settings/*`) to `/login`.
- **Schema:** all SQL lives in `supabase/migrations/*.sql`. TypeScript types are generated with `supabase gen types` into `src/lib/supabase/database.types.ts`.

Suggested source layout:

```
chirp/
  src/
    app/                 routes (see §5)
    components/          ui (shadcn), post/, profile/, layout/
    lib/
      supabase/          server.ts, client.ts, middleware.ts, database.types.ts
      validation/        zod schemas
      actions/           server actions grouped by domain (posts, social, profile, auth)
      queries/           read helpers used by server components
      utils/             time formatting, username helpers
  supabase/
    migrations/
    seed.sql
    tests/               pgTAP tests
  e2e/                   Playwright tests
```

## 4. Data model

All tables in `public`, RLS enabled on every table.

### profiles
| column | type | notes |
|---|---|---|
| id | uuid PK | = `auth.users.id`, on delete cascade |
| username | text unique | lowercase, `^[a-z0-9_]{3,15}$` |
| display_name | text | 1–50 chars |
| bio | text | ≤ 160 chars, nullable |
| avatar_url | text | nullable |
| created_at | timestamptz | default now() |

Created by an `after insert on auth.users` trigger. Username source: signup form metadata (`username`) for email signups; GitHub `user_name` for OAuth signups, sanitized, with a numeric suffix if taken.

### posts
| column | type | notes |
|---|---|---|
| id | bigint identity PK | |
| author_id | uuid FK profiles | on delete cascade |
| content | text | ≤ 280 chars, nullable |
| image_path | text | nullable, path in `post-images` bucket |
| reply_to_id | bigint FK posts | nullable, on delete set null |
| like_count, repost_count, reply_count | int | default 0, maintained by triggers |
| created_at | timestamptz | default now() |

Check: `content` (trimmed, non-empty) or `image_path` must be present. Indexes on `(author_id, created_at desc)` and `(reply_to_id, created_at)`.

### likes / reposts
`(user_id uuid FK profiles, post_id bigint FK posts, created_at)` with PK `(user_id, post_id)`. Both cascade on delete.

### follows
`(follower_id uuid, followee_id uuid, created_at)` with PK `(follower_id, followee_id)`, check `follower_id <> followee_id`, index on `followee_id`.

### notifications
| column | type | notes |
|---|---|---|
| id | bigint identity PK | |
| recipient_id | uuid FK profiles | |
| actor_id | uuid FK profiles | |
| type | enum `follow, like, repost, reply` | |
| post_id | bigint FK posts | nullable, cascade |
| read_at | timestamptz | nullable |
| created_at | timestamptz | default now() |

Inserted by `security definer` triggers on `follows`, `likes`, `reposts` and reply inserts on `posts`. No notification when `actor_id = recipient_id`. Removing a like/repost/follow does not delete the notification.

### Triggers
- Counter triggers on `likes`, `reposts` and `posts` (replies) increment/decrement the parent post counters.
- Notification triggers as above.
- Profile creation trigger on `auth.users`.

### Feed function
`home_feed(p_cursor timestamptz default null, p_limit int default 20)`, `security invoker`, returns rows of:
`post fields + author profile fields + reposted_by (profile or null) + activity_at + liked_by_me + reposted_by_me`.

Includes: posts by the current user, posts by followed users, and reposts by followed users (the latter with `activity_at = repost.created_at`). Excludes replies from the main feed. Ordered by `activity_at desc`, keyset paginated on `activity_at < p_cursor`. If the same post appears as both an original and a repost, show the most recent activity only.

A similar `profile_timeline(p_username, p_tab, p_cursor, p_limit)` returns a user's posts+reposts (`posts` tab) or their replies (`replies` tab).

### RLS policies
- `profiles`: select for everyone; update only own row.
- `posts`: select for everyone; insert only with `author_id = auth.uid()`; delete only own; no update.
- `likes`, `reposts`, `follows`: select for everyone; insert/delete only where the user column = `auth.uid()`.
- `notifications`: select and update (`read_at` only) where `recipient_id = auth.uid()`; no direct insert from clients.

### Storage
- Buckets `avatars` and `post-images`, public read.
- Insert/update/delete allowed only under the `{auth.uid()}/` prefix.
- Max 5 MB, MIME types `image/jpeg, image/png, image/webp, image/gif`. Server Actions re-check that the given path starts with the user's id.

## 5. Routes and UI

Layout: three columns on desktop (left nav, main column, right sidebar with search and "who to follow"); main column plus bottom nav on mobile.

| Route | Description |
|---|---|
| `/` | Landing for guests (pitch, login/signup, "Try the demo"); redirects to `/home` when logged in |
| `/login`, `/signup` | Email + password forms, "Continue with GitHub"; signup asks for username and display name |
| `/auth/callback` | OAuth and email-confirmation code exchange |
| `/home` | Composer (text + optional image, 280 counter) and paginated feed with "Load more" |
| `/[username]` | Profile header (avatar, name, bio, joined date, following/followers counts, follow button or "Edit profile"); tabs Posts and Replies |
| `/[username]/status/[id]` | Post detail: parent post (if reply), the post, reply composer, replies list |
| `/[username]/followers`, `/[username]/following` | User lists with follow buttons |
| `/search?q=` | Tabs People (username / display name, `ilike`) and Posts (content, `ilike`) |
| `/notifications` | Notification list; viewing marks them as read; unread count badge in nav |
| `/settings/profile` | Edit display name, bio, avatar, username |

Post card: avatar, display name, @username, relative time, content, optional image, action bar (reply / repost / like with counts, delete on own posts). Reposts show a "@x reposted" header. Clicking the card opens the detail page.

Key flows:
- **Like/repost/follow:** optimistic UI → Server Action → revalidate; on error revert + toast.
- **Create post with image:** client uploads the file to `post-images/{uid}/{uuid}.{ext}` → Server Action validates path and content → inserts post → revalidates `/home`.
- **First GitHub login:** profile auto-created → redirect to `/home`; username can be changed in settings.
- **Delete post:** confirmation dialog → Server Action → image removed from storage → revalidate.

## 6. Error handling

- Zod field errors are shown under form fields; other action errors as toasts.
- Postgres unique violation on `profiles.username` maps to "Username is already taken".
- `not-found.tsx` for unknown users/posts, `error.tsx` with a retry button, `loading.tsx` skeletons for feed and profile.
- Post content is always rendered as text (no `dangerouslySetInnerHTML`).
- The service role key is never used by the app at runtime.

## 7. Testing

- **Unit (Vitest):** Zod schemas, relative time formatting, username sanitizing/suffixing.
- **Database (pgTAP, `supabase test db`):**
  - RLS: cannot insert a post/like/follow as another user; cannot read others' notifications; cannot update others' profiles.
  - Constraints: no self-follow, no double like, content length, content-or-image check.
  - Counter triggers increment and decrement correctly.
  - Notification triggers fire for follow/like/repost/reply and skip self-actions.
  - `home_feed` includes own + followed posts and followed reposts, excludes replies, orders and paginates correctly.
- **End to end (Playwright, against local Supabase):**
  1. Sign up → create a post → post appears in feed.
  2. Follow another user → like and repost their post → they see notifications.
  3. Reply to a post → reply appears on the detail page.
- **CI (GitHub Actions):** lint, typecheck, Vitest, `supabase start` + `supabase test db`. Playwright runs in CI if setup stays reasonable; otherwise it runs locally and the README documents it.

## 8. Seed and demo

- `supabase/seed.sql` creates demo users, posts, follows, likes, reposts and replies for local development.
- Production demo: a `demo` account created by a one-off seed script using the service role key from a local env var. "Try the demo" logs in through a Server Action that reads `DEMO_EMAIL` / `DEMO_PASSWORD` from server env vars, so no credentials are in the repo.

## 9. Deployment

- Local development uses the Supabase CLI local stack (requires Docker).
- Production: new Supabase project, migrations applied with `supabase db push`; new Vercel project linked to the GitHub repo.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DEMO_EMAIL`, `DEMO_PASSWORD`, `NEXT_PUBLIC_SITE_URL`.
- GitHub OAuth App is created by the owner; steps documented in the README.
- Creating cloud projects, deploying and pushing to GitHub each require explicit approval from the owner at the time.

## 10. Changes from the PHP version

- Plain-text passwords → Supabase Auth (hashed).
- SQL injection in login/register → parameterized queries via the Supabase client, plus RLS.
- Tweets created via GET (CSRF) → Server Actions (POST, origin-checked by Next.js).
- Swapped followers/following counts fixed; usernames are unique; unfollow added; self-follow blocked.
- Stored procedures → RLS-protected queries and two SQL functions (`home_feed`, `profile_timeline`).
- New: likes, reposts, replies, images, notifications, profile editing, responsive UI.
