"use client";

import { cn } from "@/lib/utils";

type RelationAvatarProps = {
  avatarUrl: string | null;
  name?: string | null;
  username: string;
  className?: string;
  testId?: string;
};

export function RelationAvatar({
  avatarUrl,
  name,
  username,
  className,
  testId = "relation-avatar",
}: RelationAvatarProps) {
  const displayName = name || username || "user";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div
      className={cn("relative h-12 w-12 shrink-0", className)}
      aria-label={`${displayName} avatar`}
      data-testid={testId}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt={displayName}
          className="h-full w-full rounded-full object-cover"
          referrerPolicy="no-referrer"
          data-testid={`${testId}-image`}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary"
          data-testid={`${testId}-initials`}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
