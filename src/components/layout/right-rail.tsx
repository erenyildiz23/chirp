import { Search } from "lucide-react";

/** Desktop-only right column: search box (and suggestions, added with search). */
export function RightRail() {
  return (
    <div className="sticky top-0 flex flex-col gap-4 py-3">
      <form action="/search" role="search" className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          name="q"
          type="search"
          placeholder="Search Chirp"
          aria-label="Search Chirp"
          className="h-11 w-full rounded-full border bg-muted pr-4 pl-11 text-sm outline-none focus:border-primary focus:bg-background"
        />
      </form>
    </div>
  );
}
