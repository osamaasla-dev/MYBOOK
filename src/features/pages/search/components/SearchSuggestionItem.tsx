"use client";

import { RelationAvatar } from "@/features/pages/relations/components/RelationsList/components/RelationAvatar";
import { cn } from "@/lib/utils";

import type { UserSearchSuggestion } from "../services/client/userSearchApi";

type SearchSuggestionItemProps = {
  suggestion: UserSearchSuggestion;
  isActive: boolean;
  id: string;
  onSelect: () => void;
  onHover: () => void;
  testId?: string;
};

export function SearchSuggestionItem({
  suggestion,
  isActive,
  id,
  onSelect,
  onHover,
  testId = "search-suggestion-item",
}: SearchSuggestionItemProps) {
  return (
    <button
      type="button"
      id={id}
      role="option"
      aria-selected={isActive}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition cursor-pointer",
        isActive ? "bg-primary/10 shadow-sm" : "hover:bg-muted/60"
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        onSelect();
      }}
      onMouseEnter={onHover}
      data-testid={testId}
      aria-label={`Select ${
        suggestion.name || suggestion.username
      } from search suggestions`}
    >
      <RelationAvatar
        avatarUrl={suggestion.avatarUrl}
        name={suggestion.name}
        username={suggestion.username}
        className="h-10 w-10"
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {suggestion.name || suggestion.username}
        </p>
        {suggestion.relationship ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {suggestion.relationship.isFriend
              ? "Friend"
              : suggestion.relationship.isFollowing && "Following"}
          </p>
        ) : null}
      </div>
    </button>
  );
}
