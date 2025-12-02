"use client";

import Link from "next/link";

import type { PostVisibility, PostVisibilityPreference } from "@prisma/client";

import type { CurrentUser } from "@/features/types";
import { VisibilitySelector } from "./VisibilitySelector";

type ComposerProfileRowProps = {
  user: CurrentUser | null | undefined;
  displayName: string;
  initials: string;
  visibility: PostVisibility;
  visibilityPreference: PostVisibilityPreference;
  onVisibilityChange: (selection: {
    visibility: PostVisibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
};

export function ProfileRow({
  user,
  displayName,
  initials,
  visibility,
  visibilityPreference,
  onVisibilityChange,
}: ComposerProfileRowProps) {
  const profileHref = user?.username ? `/user/profile/${user.username}` : "#";

  return (
    <div className="flex items-center gap-3">
      <Link
        href={profileHref}
        aria-label="View profile"
        className="relative h-12 w-12 shrink-0"
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={displayName}
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
            {initials}
          </span>
        )}
      </Link>

      <div className="flex flex-col">
        <span className="text-sm font-semibold text-foreground">
          {displayName}
        </span>
        <VisibilitySelector
          visibility={visibility}
          visibilityPreference={visibilityPreference}
          onChange={onVisibilityChange}
        />
      </div>
    </div>
  );
}
