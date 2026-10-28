import { cn } from "@/lib/utils";

/** Chirp's mark: a round bird with a small beak, drawn in the current text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("text-primary", className)}>
      <circle cx="14" cy="17" r="11" fill="currentColor" />
      <path d="M24 13.5 30.5 16 24 18.5Z" fill="currentColor" />
      <circle cx="18" cy="13" r="1.8" className="fill-background" />
    </svg>
  );
}
