"use client";
import Link from "next/link";

import { useCurrentUser } from "@/features/hooks";

export function NavbarProfileLink() {
  const { data: user } = useCurrentUser();
  const initials = user?.username?.charAt(0).toUpperCase() ?? "؟";
  const profileLabel = user?.username
    ? `Go to ${user.username}'s profile`
    : "Go to profile";

  const avatarContent = user?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatarUrl}
      alt={user.username ?? "Profile"}
      className="h-full w-full rounded-full object-cover bg-white"
      referrerPolicy="no-referrer"
      data-testid="navbar-profile-avatar-image"
    />
  ) : (
    <span
      className="flex h-full w-full items-center justify-center rounded-full bg-white text-primary-dark font-semibold"
      data-testid="navbar-profile-avatar-initials"
    >
      {initials}
    </span>
  );

  return (
    <Link
      href={`/user/profile/${user?.username}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-white/50 rounded-full"
      aria-label={profileLabel}
      data-testid="navbar-profile-link"
    >
      <div className="relative h-10 w-10">
        {avatarContent}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-black/0 transition group-hover:bg-black/20"
        />
      </div>
    </Link>
  );
}

export default NavbarProfileLink;
