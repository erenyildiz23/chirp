import { Search } from "lucide-react";

export function SearchBox({ defaultValue, autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  return (
    <form action="/search" role="search" className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        maxLength={100}
        placeholder="Search Chirp"
        aria-label="Search Chirp"
        className="h-11 w-full rounded-full border bg-muted pr-4 pl-11 text-[15px] outline-none focus:border-primary focus:bg-background"
      />
    </form>
  );
}
