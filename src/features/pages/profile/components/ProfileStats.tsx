"use client";

import Link from "next/link";

import type { ProfileRouteData } from "../types";
import type { RelationTab } from "@/features/pages/relations/types";

const statClasses =
  "flex flex-col items-center rounded-xl border border-border/60 bg-white px-4 py-3 text-center transition hover:border-primary/40 hover:shadow";

type ProfileStatsProps = {
  profile: ProfileRouteData["profile"];
};

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats: Array<{ label: string; value: number; tab: RelationTab }> = [
    { label: "Followers", value: profile.followersCount, tab: "followers" },
    { label: "Following", value: profile.followingCount, tab: "following" },
    { label: "Friends", value: profile.friendsCount, tab: "friends" },
  ];

  return (
    <div
      className="grid gap-3 sm:grid-cols-3"
      role="list"
      aria-label="Profile statistics"
      data-testid="profile-stats"
    >
      {stats.map((stat) => (
        <Link
          key={stat.label}
          className={statClasses}
          href={`/user/relations?tab=${stat.tab}`}
          role="listitem"
          aria-label={`${stat.label} ${stat.value.toLocaleString("en-US")}`}
          data-testid={`profile-stat-${stat.tab}`}
        >
          <span className="text-2xl font-bold text-primary-dark">
            {stat.value.toLocaleString("ar-EG")}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
