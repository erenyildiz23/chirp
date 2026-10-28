import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";

// Temporary page for checking auth; replaced by the feed in Task 10.
export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user!.id).single();

  return (
    <main className="p-8">
      <p>Signed in as @{profile?.username}</p>
      <form action={signOut}>
        <button type="submit">Sign out</button>
      </form>
    </main>
  );
}
