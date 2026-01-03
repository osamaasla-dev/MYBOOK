"use client";

import type { UserSearchSuggestion } from "../services/client/userSearchApi";
import { SearchSuggestionItem } from "./SearchSuggestionItem";

type SearchSuggestionsDropdownProps = {
  dropdownId: string;
  maxHeight: number;
  suggestions: UserSearchSuggestion[];
  isReady: boolean;
  isFetching: boolean;
  isError: boolean;
  activeIndex: number;
  onSuggestionSelect: (suggestion: UserSearchSuggestion) => void;
  onSuggestionHover: (index: number) => void;
  testId?: string;
};

export function SearchSuggestionsDropdown({
  dropdownId,
  maxHeight,
  suggestions,
  isReady,
  isFetching,
  isError,
  activeIndex,
  onSuggestionSelect,
  onSuggestionHover,
  testId = "search-suggestions-dropdown",
}: SearchSuggestionsDropdownProps) {
  return (
    <div
      id={dropdownId}
      role="listbox"
      className="absolute left-0 right-0 top-full z-40 mt-2 space-y-1 rounded-2xl border border-border bg-white p-3 shadow-2xl "
      style={{ maxHeight, overflowY: "auto" }}
      aria-label="Search suggestions"
      data-testid={testId}
    >
      {isFetching ? (
        <div
          className="flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground"
          data-testid={`${testId}-loading`}
          role="status"
          aria-live="polite"
        >
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent"
            aria-hidden="true"
          />
          Loading...
        </div>
      ) : null}

      {!isFetching && isError ? (
        <div
          className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
          data-testid={`${testId}-error`}
          role="alert"
          aria-live="assertive"
        >
          Failed to load suggestions. Please try again.
        </div>
      ) : null}

      {!isFetching && suggestions.length === 0 && !isError && isReady ? (
        <div
          className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-testid={`${testId}-empty`}
          role="status"
          aria-live="polite"
        >
          No matching results found yet.
        </div>
      ) : null}

      {suggestions.map((suggestion, index) => (
        <SearchSuggestionItem
          key={suggestion.id}
          suggestion={suggestion}
          isActive={index === activeIndex}
          id={`${dropdownId}-item-${index}`}
          onSelect={() => onSuggestionSelect(suggestion)}
          onHover={() => onSuggestionHover(index)}
          testId={`${testId}-item-${index}`}
        />
      ))}
    </div>
  );
}
