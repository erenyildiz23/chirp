-- Trigger functions only ever run as triggers; keep them out of the RPC API.
revoke execute on function
  public.bump_like_count(),
  public.bump_reply_count(),
  public.bump_repost_count(),
  public.handle_new_user(),
  public.notify_on_follow(),
  public.notify_on_like(),
  public.notify_on_reply(),
  public.notify_on_repost(),
  public.protect_demo_auth(),
  public.protect_demo_profile(),
  public.set_is_reply()
from public, anon, authenticated;

-- Deleting a user or a post cascades into notifications through these keys.
create index notifications_actor_idx on public.notifications (actor_id);
create index notifications_post_idx on public.notifications (post_id);
