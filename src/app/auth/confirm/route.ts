import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseConfirmParams } from "@/lib/utils/confirm";

// Email confirmation links land here. Unlike the PKCE code in /auth/callback,
// a token hash needs nothing stored in the browser, so the link works even when
// it is opened in a different browser or a mail app's built-in browser.
export async function GET(request: NextRequest) {
  const { origin, searchParams } = request.nextUrl;
  const params = parseConfirmParams(searchParams);

  if (params) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: params.type, token_hash: params.tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${params.next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirm`);
}
