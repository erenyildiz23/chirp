// Profiles live at /<username>, so these collide with app routes.
// Keep in sync with public.is_reserved_username in the database.
export const RESERVED_USERNAMES = new Set([
  "about",
  "admin",
  "api",
  "auth",
  "chirp",
  "explore",
  "followers",
  "following",
  "help",
  "home",
  "login",
  "logout",
  "messages",
  "notifications",
  "privacy",
  "search",
  "settings",
  "signup",
  "status",
  "terms",
]);
