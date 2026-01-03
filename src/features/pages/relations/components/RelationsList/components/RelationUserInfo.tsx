"use client";

import { cn } from "@/lib/utils";

import type { RelationUserSummary } from "../../../types";

type RelationUserInfoProps = {
  user: RelationUserSummary;
  className?: string;
  showBio?: boolean;
  testId?: string;
};

export function RelationUserInfo({
  user,
  className,
  showBio = true,
  testId = "relation-user-info",
}: RelationUserInfoProps) {
  return (
    <div className={cn("min-w-0 flex-1", className)} data-testid={testId}>
      <p
        className="truncate text-sm font-semibold text-foreground"
        data-testid={`${testId}-name`}
      >
        {user.name || user.username}
      </p>
      <p
        className="truncate text-xs text-muted-foreground"
        data-testid={`${testId}-username`}
      >
        @{user.username}
      </p>
      {showBio && user.bio && (
        <p
          className="mt-1 line-clamp-1 text-xs text-muted-foreground"
          data-testid={`${testId}-bio`}
        >
          {user.bio}
        </p>
      )}
    </div>
  );
}
