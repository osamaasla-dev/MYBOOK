"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserSearchSuggestion } from "../services/client/userSearchApi";
import { useUserSearchBoxController } from "../hooks/ui/useUserSearchBoxController";
import { SearchInputForm } from "./SearchInputForm";
import { SearchSuggestionsDropdown } from "./SearchSuggestionsDropdown";

type UserSearchBoxProps = {
  placeholder?: string;
  autoFocus?: boolean;
  debounceMs?: number;
  minLength?: number;
  maxHeight?: number;
  className?: string;
  onSubmit?: (query: string) => void;
  onSuggestionSelect?: (suggestion: UserSearchSuggestion) => void;
  testId?: string;
};

const DROPDOWN_ID = "user-search-suggestions";

export function UserSearchBox({
  placeholder = "Search for people...",
  autoFocus,
  debounceMs = 220,
  minLength = 2,
  maxHeight = 320,
  className,
  onSubmit,
  onSuggestionSelect,
  testId = "user-search-box",
}: UserSearchBoxProps) {
  const {
    containerRef,
    inputValue,

    shouldShowDropdown,
    activeIndex,
    suggestions,
    isReady,
    isFetching,
    isError,
    handleInputChange,
    handleFocus,
    handleBlur,
    handleKeyDown,
    handleSubmit,
    handleSuggestionSelect,
    handleSuggestionHover,
  } = useUserSearchBoxController({
    debounceMs,
    minLength,
    onSubmit,
    onSuggestionSelect,
  });

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      role="combobox"
      aria-expanded={shouldShowDropdown}
      aria-haspopup="listbox"
      aria-controls={shouldShowDropdown ? DROPDOWN_ID : undefined}
      aria-label="User search"
      data-testid={testId}
    >
      <SearchInputForm
        value={inputValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        dropdownId={DROPDOWN_ID}
        shouldShowDropdown={shouldShowDropdown}
        activeOptionId={
          activeIndex >= 0 ? `${DROPDOWN_ID}-item-${activeIndex}` : undefined
        }
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSubmit={handleSubmit}
        testId={`${testId}-input`}
      />

      {shouldShowDropdown ? (
        <>
          {isFetching ? (
            <div
              className="absolute left-1/2 top-full z-40 mt-2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-muted/80 px-3 py-1 text-xs text-muted-foreground shadow"
              data-testid={`${testId}-loading`}
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading results...
            </div>
          ) : null}

          <SearchSuggestionsDropdown
            dropdownId={DROPDOWN_ID}
            maxHeight={maxHeight}
            suggestions={suggestions}
            isReady={isReady}
            isFetching={isFetching}
            isError={isError}
            activeIndex={activeIndex}
            onSuggestionSelect={handleSuggestionSelect}
            onSuggestionHover={handleSuggestionHover}
            testId={`${testId}-dropdown`}
          />
        </>
      ) : null}
    </div>
  );
}
