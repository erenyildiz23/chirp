// Control characters are stripped by URL parsers ("/\t/evil.com" becomes
// "//evil.com"), and backslashes are treated like slashes, so both are refused.
// eslint-disable-next-line no-control-regex
const UNSAFE = /[\u0000-\u001f\u007f\\]/;

/** Only same-site relative paths are allowed as post-login redirect targets. */
export function safeNext(next: string | null | undefined, fallback = "/home"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || UNSAFE.test(next)) {
    return fallback;
  }
  // Belt and braces: the resolved URL must stay on our origin.
  const base = "http://chirp.invalid";
  return new URL(next, base).origin === base ? next : fallback;
}
