"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import type { UserSearchSuggestion } from "@/features/pages/search/services/client/userSearchApi";
import { UserSearchBox } from "@/features/pages/search/components/UserSearchBox";

export function NavbarSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const navigateToSearchPage = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("query", trimmed);
      const queryString = params.toString();
      router.push(queryString ? `/user/search?${queryString}` : "/user/search");
    },
    [router]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: UserSearchSuggestion) => {
      router.push(`/user/profile/${encodeURIComponent(suggestion.username)}`);
    },
    [router]
  );

  return (
    <div
      className="relative w-full max-w-md"
      ref={containerRef}
      data-testid="navbar-search"
      role="search"
      aria-label="Search users"
    >
      <UserSearchBox
        debounceMs={300}
        minLength={1}
        onSubmit={navigateToSearchPage}
        onSuggestionSelect={handleSuggestionSelect}
      />
    </div>
  );
}

export default NavbarSearch;
