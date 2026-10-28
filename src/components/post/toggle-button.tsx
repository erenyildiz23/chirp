"use client";

import { useOptimistic, useState, useTransition } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

type ToggleState = { active: boolean; count: number };

function flip(current: ToggleState, active: boolean): ToggleState {
  if (current.active === active) return current;
  return { active, count: Math.max(0, current.count + (active ? 1 : -1)) };
}

type ToggleButtonProps = {
  initial: ToggleState;
  icon: LucideIcon;
  /** Accessible names for the two states, e.g. ["Like", "Unlike"]. */
  labels: [string, string];
  activeClassName: string;
  hoverClassName: string;
  fillWhenActive?: boolean;
  disabled?: boolean;
  onToggle: (next: boolean) => Promise<ActionResult>;
};

/** A counter button that flips instantly and rolls back if the server says no. */
export function ToggleButton({
  initial,
  icon: Icon,
  labels,
  activeClassName,
  hoverClassName,
  fillWhenActive = false,
  disabled = false,
  onToggle,
}: ToggleButtonProps) {
  // Confirmed state; posts appended by "Load more" never get fresh props, so the
  // result of a successful toggle has to be kept here.
  const [confirmed, setConfirmed] = useState(initial);
  const [state, setOptimistic] = useOptimistic(confirmed, (current: ToggleState, active: boolean) => flip(current, active));
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !state.active;
    startTransition(async () => {
      setOptimistic(next);
      const result = await onToggle(next);
      if (result.ok) setConfirmed((current) => flip(current, next));
      else toast.error(result.error);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled}
      aria-pressed={state.active}
      aria-label={`${state.count} ${labels[0].toLowerCase()}${state.count === 1 ? "" : "s"}. ${state.active ? labels[1] : labels[0]}`}
      className={cn("group flex items-center gap-1 disabled:opacity-60", state.active ? activeClassName : hoverClassName)}
    >
      <span className="rounded-full p-2 transition-colors group-hover:bg-current/10">
        <Icon className={cn("size-[18px]", fillWhenActive && state.active && "fill-current")} />
      </span>
      <span className="min-w-3 tabular-nums">{state.count || ""}</span>
    </button>
  );
}
