/**
 * Creates the public demo account (and a few companions so its feed isn't empty)
 * in a Supabase project. Safe to run more than once.
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... DEMO_EMAIL=... DEMO_PASSWORD=... \
 *     npx tsx scripts/seed-demo.ts
 *
 * Re-running it also resets the demo account (password, username, profile) if a
 * visitor changed what they could.
 *
 * The service role key bypasses RLS: run this from your machine only, never ship it.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
}

const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Seed = { username: string; displayName: string; bio: string; posts: string[] };

const DEMO: Seed = {
  username: "demo",
  displayName: "Demo User",
  bio: "This is the shared demo account. Be nice!",
  posts: ["Hello Chirp! Trying out the demo account. 👋"],
};

const COMPANIONS: Seed[] = [
  {
    username: "nova",
    displayName: "Nova",
    bio: "Frontend, typography and too much coffee.",
    posts: ["Dark mode or no mode.", "Shipped a new design system today. Tokens all the way down."],
  },
  {
    username: "kai",
    displayName: "Kai",
    bio: "Databases are my love language.",
    posts: ["Row level security is underrated.", "Keyset pagination > offset pagination. Fight me."],
  },
  {
    username: "mira",
    displayName: "Mira",
    bio: "Writing tests so you don't have to.",
    posts: ["Tests are documentation that can fail.", "Flaky test count this week: 0. Celebrating."],
  },
  {
    username: "theo",
    displayName: "Theo",
    bio: "Weekend hacker.",
    posts: ["Rewrote an old PHP project in Next.js. Feels great.", "Who else names variables after snacks?"],
  },
];

async function findUserId(email: string): Promise<string | null> {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
}

async function ensureUser(email: string, password: string, seed: Seed): Promise<string> {
  const existing = await findUserId(email);
  if (existing) {
    console.log(`= ${email} already exists`);
    return existing;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username: seed.username, display_name: seed.displayName },
  });
  if (error) throw error;

  await supabase.from("profiles").update({ bio: seed.bio }).eq("id", data.user.id);
  console.log(`+ created ${email}`);
  return data.user.id;
}

async function ensurePosts(userId: string, posts: string[]): Promise<number[]> {
  const { data: existing } = await supabase.from("posts").select("id").eq("author_id", userId);
  if (existing && existing.length > 0) return existing.map((p) => p.id);

  const { data, error } = await supabase
    .from("posts")
    .insert(posts.map((content) => ({ author_id: userId, content })))
    .select("id");
  if (error) throw error;
  return data.map((p) => p.id);
}

/**
 * Puts the demo account back the way it was: password, username, name, bio and
 * avatar. The database refuses these changes while is_demo is set, so the flag is
 * cleared first (the service role can) and set again at the end.
 */
async function resetDemo(id: string, password: string): Promise<void> {
  await must(supabase.from("profiles").update({ is_demo: false }).eq("id", id));
  const { error } = await supabase.auth.admin.updateUserById(id, { password });
  if (error) throw error;
  await must(
    supabase
      .from("profiles")
      .update({ username: DEMO.username, display_name: DEMO.displayName, bio: DEMO.bio, avatar_url: null, is_demo: true })
      .eq("id", id),
  );
  console.log("~ demo account reset");
}

async function must(query: PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await query;
  if (error) throw error;
}

async function main() {
  const demoId = await ensureUser(env("DEMO_EMAIL"), env("DEMO_PASSWORD"), DEMO);
  await resetDemo(demoId, env("DEMO_PASSWORD"));
  const demoPosts = await ensurePosts(demoId, DEMO.posts);

  for (const seed of COMPANIONS) {
    // Companions never log in, so their passwords are random and thrown away.
    const id = await ensureUser(`${seed.username}@demo.chirp.invalid`, randomBytes(24).toString("hex"), seed);
    const posts = await ensurePosts(id, seed.posts);

    await supabase.from("follows").upsert(
      [
        { follower_id: demoId, followee_id: id },
        { follower_id: id, followee_id: demoId },
      ],
      { onConflict: "follower_id,followee_id", ignoreDuplicates: true },
    );
    await supabase
      .from("likes")
      .upsert(
        demoPosts.map((postId) => ({ user_id: id, post_id: postId })),
        { onConflict: "user_id,post_id", ignoreDuplicates: true },
      );
    if (posts[0]) {
      await supabase
        .from("likes")
        .upsert({ user_id: demoId, post_id: posts[0] }, { onConflict: "user_id,post_id", ignoreDuplicates: true });
    }
  }

  console.log("Demo data is ready.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
