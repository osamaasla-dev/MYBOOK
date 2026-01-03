"use client";

import Link from "next/link";

import type { RelationListItem } from "../../../types";
import { RelationAvatar } from "./RelationAvatar";
import { RelationUserInfo } from "./RelationUserInfo";
import { RelationActions } from "./RelationActions";

type RelationListItemProps = {
  item: RelationListItem;
  testId?: string;
  index?: number;
};

export function RelationListItem({
  item,
  testId = "relation-list-item-row",
  index,
}: RelationListItemProps) {
  const { user, tab } = item;
  const profileHref = `/user/profile/${encodeURIComponent(user.username)}`;

  return (
    <li
      className="flex items-center gap-4 border-b border-border/60 px-4 py-4 last:border-none"
      data-testid={testId}
      role="listitem"
      aria-label={`Relation ${index ? index + 1 : ""}: ${
        user.name || user.username
      } (${tab})`}
    >
      <Link
        href={profileHref}
        className="flex min-w-0 flex-1 items-center gap-4"
        aria-label={`View ${user.name || user.username} profile, tab: ${tab}`}
        data-testid={`${testId}-profile-link`}
      >
        <RelationAvatar
          avatarUrl={user.avatarUrl}
          name={user.name}
          username={user.username}
          testId={`${testId}-avatar`}
        />
        <RelationUserInfo user={user} testId={`${testId}-user-info`} />
      </Link>

      <div className="flex flex-col items-end gap-2">
        <RelationActions tab={tab} user={user} testId={`${testId}-actions`} />
      </div>
    </li>
  );
}
