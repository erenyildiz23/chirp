"use client";

import { Repeat2 } from "lucide-react";
import { setRepost } from "@/lib/actions/social";
import { ToggleButton } from "./toggle-button";

export function RepostButton({
  postId,
  reposted,
  count,
  disabled,
}: {
  postId: number;
  reposted: boolean;
  count: number;
  disabled?: boolean;
}) {
  return (
    <ToggleButton
      initial={{ active: reposted, count }}
      icon={Repeat2}
      labels={["Repost", "Undo repost"]}
      activeClassName="text-repost"
      hoverClassName="hover:text-repost"
      disabled={disabled}
      onToggle={(next) => setRepost(postId, next)}
    />
  );
}
