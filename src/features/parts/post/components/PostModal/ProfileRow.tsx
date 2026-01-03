"use client";

import Link from "next/link";

import type { Visibility, PostVisibilityPreference } from "@prisma/client";

import type { CurrentUser } from "@/features/types";
import { VisibilitySelector } from "./VisibilitySelector";

type ComposerProfileRowProps = {
  user: CurrentUser | null | undefined;
  displayName: string;
  initials: string;
  visibility: Visibility;
  visibilityPreference: PostVisibilityPreference;
  onVisibilityChange: (selection: {
    visibility: Visibility;
    visibilityPreference: PostVisibilityPreference;
  }) => void;
  testId?: string;
};

export function ProfileRow({
  user,
  displayName,
  initials,
  visibility,
  visibilityPreference,
  onVisibilityChange,
  testId,
}: ComposerProfileRowProps) {
  const profileHref = user?.username ? `/user/profile/${user.username}` : "#";

  return (
    <div
      className="flex items-center gap-3"
      role="group"
      aria-label="Post author information"
      data-testid={testId || "profile-row"}
    >
      <Link
        href={profileHref}
        aria-label={`View ${displayName}'s profile`}
        className="relative h-12 w-12 shrink-0"
        data-testid={testId ? `${testId}-avatar-link` : "profile-avatar-link"}
      >
        {user?.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={`${displayName}'s profile picture`}
            className="h-full w-full rounded-full object-cover"
            referrerPolicy="no-referrer"
            data-testid={testId ? `${testId}-avatar-img` : "profile-avatar-img"}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
            aria-label={`${displayName}'s initials: ${initials}`}
            data-testid={
              testId ? `${testId}-avatar-initials` : "profile-avatar-initials"
            }
          >
            {initials}
          </span>
        )}
      </Link>

      <div className="flex flex-col">
        <Link
          href={profileHref}
          data-testid={testId ? `${testId}-name-link` : "profile-name-link"}
        >
          <span
            className="text-sm font-semibold text-foreground"
            data-testid={testId ? `${testId}-name` : "profile-name"}
          >
            {displayName}
          </span>
        </Link>
        <VisibilitySelector
          visibility={visibility}
          visibilityPreference={visibilityPreference}
          onChange={onVisibilityChange}
          testId={testId ? `${testId}-visibility` : "profile-visibility"}
        />
      </div>
    </div>
  );
}
