"use client";

import Link from "next/link";

import type { UserSearchResult } from "@/features/pages/search/types";
import { cn } from "@/lib/utils";

type SearchResultCardProps = {
  result: UserSearchResult;
  testId?: string;
  index?: number;
};

const BADGE_STYLES = {
  friend: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  following: "bg-sky-50 text-sky-700 ring-sky-200",
  neutral: "bg-muted text-muted-foreground ring-muted/60",
} as const;

export function SearchResultCard({
  result,
  testId = "search-result-card",
  index,
}: SearchResultCardProps) {
  const profileHref = `/user/profile/${encodeURIComponent(result.username)}`;
  const displayName = result.name || result.username;
  const initials = (displayName ?? "?").charAt(0).toUpperCase();

  const badges: Array<{ label: string; className: string }> = [];

  if (result.relationship.isFriend) {
    badges.push({ label: "Friend", className: BADGE_STYLES.friend });
  }

  if (result.relationship.isFollowing) {
    badges.push({ label: "Following", className: BADGE_STYLES.following });
  }

  if (!badges.length) {
    badges.push({
      label: "No connection yet",
      className: BADGE_STYLES.neutral,
    });
  }

  return (
    <li
      data-testid={`${testId}-${result.id}`}
      aria-label={`Search result ${index ? index + 1 : ""}: ${displayName}`}
      role="listitem"
    >
      <Link
        href={profileHref}
        className="block rounded-xl border border-border/60 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Open ${displayName} profile, ${badges
          .map((b) => b.label)
          .join(", ")}`}
        data-testid={`${testId}-link`}
      >
        <div className="flex items-center gap-4">
          <div
            className="relative h-14 w-14 shrink-0"
            data-testid={`${testId}-avatar`}
          >
            {result.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.avatarUrl}
                alt={`${displayName} avatar`}
                className="h-full w-full rounded-full object-cover"
                referrerPolicy="no-referrer"
                data-testid={`${testId}-avatar-image`}
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary"
                data-testid={`${testId}-avatar-initials`}
                aria-label={`${displayName} initials: ${initials}`}
              >
                {initials}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-lg font-semibold text-foreground"
              data-testid={`${testId}-name`}
            >
              {displayName}
            </p>
            <div
              className="mt-3 flex flex-wrap gap-2"
              role="group"
              aria-label="Relationship badges"
            >
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset",
                    badge.className
                  )}
                  data-testid={`${testId}-badge-${badge.label
                    .toLowerCase()
                    .replace(" ", "-")}`}
                  aria-label={`Relationship: ${badge.label}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}
