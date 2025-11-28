"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ProfileRouteData } from "../types";

const statClasses =
  "flex flex-col items-center rounded-xl border border-border/60 bg-secondary px-4 py-3 text-center";

type ProfileStatsProps = {
  profile: ProfileRouteData["profile"];
  viewer: ProfileRouteData["viewer"];
};

export function ProfileStats({ profile, viewer }: ProfileStatsProps) {
  const stats: Array<{ label: string; value: number }> = [
    { label: "Followers", value: profile.followersCount },
    { label: "Following", value: profile.followingCount },
    { label: "Friends", value: profile.friendsCount },
  ];

  return (
    <div className="space-y-3">
      <div
        className="grid gap-3 sm:grid-cols-3"
        role="list"
        aria-label="Profile statistics"
        data-testid="profile-stats"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={statClasses}
            role="listitem"
            aria-label={`${stat.label} ${stat.value.toLocaleString("en-US")}`}
          >
            <span className="text-2xl font-bold text-primary-dark">
              {stat.value.toLocaleString("ar-EG")}
            </span>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {viewer.isSelf && (
        <div className="flex justify-end">
          <Button asChild>
            <Link href="/user/relations">RELATIONS {">>"}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
