"use client";

import { Heart } from "lucide-react";
import { setLike } from "@/lib/actions/social";
import { ToggleButton } from "./toggle-button";

export function LikeButton({ postId, liked, count, disabled }: { postId: number; liked: boolean; count: number; disabled?: boolean }) {
  return (
    <ToggleButton
      initial={{ active: liked, count }}
      icon={Heart}
      labels={["Like", "Unlike"]}
      activeClassName="text-like"
      hoverClassName="hover:text-like"
      fillWhenActive
      disabled={disabled}
      onToggle={(next) => setLike(postId, next)}
    />
  );
}
