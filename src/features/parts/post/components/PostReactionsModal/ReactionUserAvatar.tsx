"use client";

import Link from "next/link";

type ReactionUserAvatarProps = {
  name: string | null;
  username: string;
  avatarUrl: string | null;
};

export function ReactionUserAvatar({
  name,
  username,
  avatarUrl,
}: ReactionUserAvatarProps) {
  const displayName = name ?? username ?? "User";
  const initials = displayName.charAt(0).toUpperCase();
  const profileHref = username
    ? `/user/profile/${encodeURIComponent(username)}`
    : "#";

  const avatarContent = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={displayName}
      className="size-12 rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
      {initials}
    </span>
  );

  return (
    <Link
      href={profileHref}
      aria-label={`View ${displayName}'s profile`}
      className="block"
    >
      {avatarContent}
    </Link>
  );
}
