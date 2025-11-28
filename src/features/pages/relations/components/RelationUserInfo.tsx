"use client";

import { cn } from "@/lib/utils";

import type { RelationUserSummary } from "../types";

type RelationUserInfoProps = {
  user: RelationUserSummary;
  className?: string;
  showBio?: boolean;
};

export function RelationUserInfo({
  user,
  className,
  showBio = true,
}: RelationUserInfoProps) {
  return (
    <div className={cn("min-w-0 flex-1", className)}>
      <p className="truncate text-sm font-semibold text-foreground">
        {user.name || user.username}
      </p>
      <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
      {showBio && user.bio && (
        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
          {user.bio}
        </p>
      )}
    </div>
  );
}
