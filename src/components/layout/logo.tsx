import { cn } from "@/lib/utils";

/** A small bird mark drawn inline so it follows the current text color. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("fill-current text-primary", className)}>
      <path d="M27.5 8.2c-.9.4-1.8.6-2.8.8 1-.6 1.8-1.6 2.1-2.7-.9.6-2 1-3.1 1.2a4.9 4.9 0 0 0-8.4 4.5C11.2 11.8 7.6 9.9 5.2 7c-.4.7-.7 1.6-.7 2.5 0 1.7.9 3.2 2.2 4.1-.8 0-1.6-.3-2.2-.6v.1c0 2.4 1.7 4.4 3.9 4.8-.4.1-.8.2-1.3.2-.3 0-.6 0-.9-.1.6 2 2.4 3.4 4.6 3.4A9.9 9.9 0 0 1 3.5 23.5c2.2 1.4 4.8 2.2 7.5 2.2 9 0 14-7.5 14-14v-.6c1-.7 1.8-1.6 2.5-2.6Z" />
    </svg>
  );
}
