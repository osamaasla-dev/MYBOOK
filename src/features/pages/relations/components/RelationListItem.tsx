"use client";

import Link from "next/link";

import type { RelationListItem } from "../types";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

type RelationListItemProps = {
  item: RelationListItem;
};

export function RelationListItem({ item }: RelationListItemProps) {
  const { user, status } = item;
  const profileHref = `/user/profile/${encodeURIComponent(user.username)}`;
  const initials = (user.name || user.username || "?").charAt(0).toUpperCase();
  const statusLabel = status ? STATUS_LABELS[status] ?? status : null;

  return (
    <li className="flex items-center gap-4 border-b border-border/60 px-4 py-4 last:border-none">
      <Link
        href={profileHref}
        className="flex min-w-0 flex-1 items-center gap-4"
        aria-label={`View ${user.name || user.username} profile`}
      >
        <div className="relative h-12 w-12 shrink-0">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.name || user.username}
              className="h-full w-full rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
              {initials}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user.name || user.username}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            @{user.username}
          </p>
          {user.bio && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
              {user.bio}
            </p>
          )}
        </div>
      </Link>

      {statusLabel && (
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
          {statusLabel.toLowerCase()}
        </span>
      )}
    </li>
  );
}
