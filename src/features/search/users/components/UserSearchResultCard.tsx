"use client";

import Link from "next/link";
import { CheckCheck, Lock } from "lucide-react";

import { RelationAvatar } from "@/features/pages/relations/components/RelationAvatar";
import type { UserSearchHit } from "../types";

type UserSearchResultCardProps = {
  hit: UserSearchHit;
};

export function UserSearchResultCard({ hit }: UserSearchResultCardProps) {
  return (
    <li className="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link
        href={`/user/profile/${encodeURIComponent(hit.username)}`}
        className="flex items-center gap-4"
        aria-label={`View ${hit.name || hit.username} profile`}
      >
        <RelationAvatar
          avatarUrl={hit.avatarUrl}
          name={hit.name}
          username={hit.username}
          className="h-14 w-14"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
            <span className="truncate">{hit.name || hit.username}</span>
            {hit.isVerified ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                <CheckCheck className="h-3 w-3" aria-hidden="true" />
                Verified
              </span>
            ) : null}
            {hit.isPrivate ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Private
              </span>
            ) : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            @{hit.username}
          </p>

          {hit.bio ? (
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
              {hit.bio}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">{hit.followersCount}</strong>{" "}
              followers
            </span>
            <span>
              <strong className="text-foreground">{hit.followingCount}</strong>{" "}
              following
            </span>
            <span>
              <strong className="text-foreground">{hit.friendsCount}</strong>{" "}
              friends
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}
