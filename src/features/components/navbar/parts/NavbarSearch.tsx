"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useUserSearch } from "@/features/search/users/hooks/useUserSearch";
import type { UserSearchHit } from "@/features/search/users/types";
import { RelationAvatar } from "@/features/pages/relations/components/RelationAvatar";
import { cn } from "@/lib/utils";

const SEARCH_INPUT_ID = "navbar-search";
const SUGGESTION_LIMIT = 5;

export function NavbarSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmedValue = value.trim();
  const debouncedQuery = useDebouncedValue(trimmedValue, 180);
  const suggestionListId = `${SEARCH_INPUT_ID}-suggestions`;

  const suggestionQuery = useUserSearch(debouncedQuery, {
    hitsPerPage: SUGGESTION_LIMIT,
    highlightAttributes: [],
    enabled: Boolean(debouncedQuery),
  });

  const suggestions = useMemo(
    () => suggestionQuery.data?.hits ?? [],
    [suggestionQuery.data?.hits]
  );

  const hasSuggestions = suggestions.length > 0;
  const shouldShowDropdown =
    isOpen &&
    (suggestionQuery.isFetching ||
      suggestionQuery.isError ||
      hasSuggestions ||
      (Boolean(debouncedQuery) && !suggestionQuery.isFetching));

  const navigateToSearchPage = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      const params = new URLSearchParams();
      if (trimmed) params.set("query", trimmed);
      const queryString = params.toString();
      router.push(queryString ? `/user/search?${queryString}` : "/user/search");
      setIsOpen(false);
      setActiveIndex(-1);
    },
    [router]
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      navigateToSearchPage(value);
    },
    [navigateToSearchPage, value]
  );

  const handleSuggestionSelect = useCallback(
    (hit: UserSearchHit) => {
      setValue(hit.username);
      setIsOpen(false);
      setActiveIndex(-1);
      router.push(`/user/profile/${encodeURIComponent(hit.username)}`);
    },
    [router]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.value);
      if (!isOpen) setIsOpen(true);
    },
    [isOpen]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (
        !shouldShowDropdown ||
        (!hasSuggestions && !suggestionQuery.isFetching)
      ) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) =>
          suggestions.length === 0 ? -1 : (prev + 1) % suggestions.length
        );
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) =>
          suggestions.length === 0
            ? -1
            : prev <= 0
            ? suggestions.length - 1
            : prev - 1
        );
      } else if (
        event.key === "Enter" &&
        activeIndex >= 0 &&
        suggestions[activeIndex]
      ) {
        event.preventDefault();
        handleSuggestionSelect(suggestions[activeIndex]);
      } else if (event.key === "Escape") {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    },
    [
      activeIndex,
      handleSuggestionSelect,
      hasSuggestions,
      shouldShowDropdown,
      suggestionQuery.isFetching,
      suggestions,
    ]
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [debouncedQuery]);

  useEffect(() => {
    if (isFocused && trimmedValue) {
      setIsOpen(true);
    } else if (!trimmedValue) {
      setIsOpen(false);
    }
  }, [isFocused, trimmedValue]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div
      className="relative w-full max-w-md"
      ref={containerRef}
      data-testid="navbar-search"
    >
      <form
        className="relative"
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search for users"
      >
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          Search for users
        </label>

        <button
          type="submit"
          className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-muted-foreground)] transition hover:text-[var(--color-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
          aria-label="عرض كل النتائج"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>

        <Input
          id={SEARCH_INPUT_ID}
          type="search"
          placeholder="ابحث عن أشخاص..."
          aria-label="بحث عن المستخدمين"
          aria-expanded={shouldShowDropdown}
          aria-controls={shouldShowDropdown ? suggestionListId : undefined}
          aria-activedescendant={
            activeIndex >= 0
              ? `${suggestionListId}-item-${activeIndex}`
              : undefined
          }
          data-testid="navbar-search-input"
          className="w-full rounded-full border-transparent bg-[var(--color-white)] py-2 pl-11 pr-4 text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus-visible:ring-[var(--color-accent)]"
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
        />
      </form>

      {shouldShowDropdown ? (
        <div
          id={suggestionListId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 space-y-1 rounded-2xl border border-border/70 bg-[var(--color-white)]/95 p-2 shadow-xl backdrop-blur"
        >
          {suggestionQuery.isFetching ? (
            <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              جاري تحميل النتائج...
            </div>
          ) : null}

          {!suggestionQuery.isFetching && suggestionQuery.isError ? (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              تعذر تحميل الاقتراحات. حاول مرة أخرى.
            </div>
          ) : null}

          {!suggestionQuery.isFetching &&
          !hasSuggestions &&
          !suggestionQuery.isError ? (
            <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              لا توجد نتائج مطابقة حتى الآن.
            </div>
          ) : null}

          {suggestions.map((hit, index) => (
            <SuggestionItem
              key={hit.objectID}
              hit={hit}
              isActive={index === activeIndex}
              onSelect={() => handleSuggestionSelect(hit)}
              onHover={() => setActiveIndex(index)}
              id={`${suggestionListId}-item-${index}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

type SuggestionItemProps = {
  hit: UserSearchHit;
  isActive: boolean;
  onSelect: () => void;
  onHover: () => void;
  id: string;
};

function SuggestionItem({
  hit,
  isActive,
  onSelect,
  onHover,
  id,
}: SuggestionItemProps) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition",
        isActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/40"
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect();
      }}
      onMouseEnter={onHover}
    >
      <RelationAvatar
        avatarUrl={hit.avatarUrl}
        name={hit.name}
        username={hit.username}
        className="h-10 w-10"
      />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">
          {hit.name || hit.username}
        </p>
        <p className="text-xs text-muted-foreground">@{hit.username}</p>
      </div>
    </button>
  );
}

export default NavbarSearch;
