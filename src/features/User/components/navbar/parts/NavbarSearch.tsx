import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";

const SEARCH_INPUT_ID = "navbar-search";

export function NavbarSearch() {
  return (
    <div className="relative w-full max-w-md" data-testid="navbar-search">
      <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
        Search for users or posts
      </label>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]"
        aria-hidden="true"
      />
      <Input
        id={SEARCH_INPUT_ID}
        type="search"
        placeholder="search for users, posts, ..."
        aria-label="Search for users, posts, and more"
        data-testid="navbar-search-input"
        className="w-full rounded-full border-transparent bg-[var(--color-white)] py-2 pl-10 pr-4 text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-[var(--color-accent)]"
      />
    </div>
  );
}

export default NavbarSearch;
