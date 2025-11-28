"use client";

import Link from "next/link";

import type { RelationListItem } from "../types";
import { RelationAvatar } from "./RelationAvatar";
import { RelationUserInfo } from "./RelationUserInfo";
import { RelationActions } from "./RelationActions";

type RelationListItemProps = {
  item: RelationListItem;
};

export function RelationListItem({ item }: RelationListItemProps) {
  const { user, tab } = item;
  const profileHref = `/user/profile/${encodeURIComponent(user.username)}`;

  return (
    <li className="flex items-center gap-4 border-b border-border/60 px-4 py-4 last:border-none">
      <Link
        href={profileHref}
        className="flex min-w-0 flex-1 items-center gap-4"
        aria-label={`View ${user.name || user.username} profile`}
      >
        <RelationAvatar
          avatarUrl={user.avatarUrl}
          name={user.name}
          username={user.username}
        />
        <RelationUserInfo user={user} />
      </Link>

      <div className="flex flex-col items-end gap-2">
        <RelationActions tab={tab} user={user} />
      </div>
    </li>
  );
}
