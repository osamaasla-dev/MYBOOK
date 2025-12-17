"use client";

import Link from "next/link";
import { useCallback } from "react";

import type { NotificationListItem } from "@/features/parts/notifications/types";
import { getNotificationPresentation } from "@/features/parts/notifications/utils/presentation";
import { FollowRequestActions } from "@/features/parts/follow/components/FollowRequestActions";
import { AcceptRejectFriendButtons } from "@/features/parts/addFriend/components/AcceptRejectFriendButtons";
import { NotificationContent } from "./NotificationContent";
import { usePostDetailsModalNavigation } from "@/features/parts/postDetails/hooks";

type NotificationItemProps = {
  notification: NotificationListItem;
  onSelect?: (notification: NotificationListItem) => void;
};

export function NotificationItem({
  notification,
  onSelect,
}: NotificationItemProps) {
  const presentation = getNotificationPresentation(notification);
  const fallbackUsername = notification.actor?.username ?? "";
  const fallbackName = notification.actor?.name ?? (fallbackUsername || "user");

  const profileHref =
    presentation?.profileHref ??
    (fallbackUsername
      ? `/user/profile/${encodeURIComponent(fallbackUsername)}`
      : "#");
  const title = presentation?.title ?? fallbackName;
  const subtitle = presentation?.subtitle ?? "sent you a notification";
  const initials =
    presentation?.initials ?? fallbackUsername?.charAt(0).toUpperCase() ?? "؟";
  const statusLabel = presentation?.statusLabel;
  const statusTone = presentation?.statusTone;
  const action = presentation?.action;
  const postId = presentation?.postId ?? notification.related.postId ?? null;
  const { openPostDetails } = usePostDetailsModalNavigation();

  const handlePostClick = useCallback(() => {
    if (!postId) return;
    openPostDetails(postId);
    onSelect?.(notification);
  }, [notification, onSelect, openPostDetails, postId]);

  const handleLinkClick = useCallback(() => {
    onSelect?.(notification);
  }, [notification, onSelect]);

  const actionContent = (() => {
    if (!action) return null;

    switch (action.kind) {
      case "follow-request":
        return (
          <FollowRequestActions
            username={action.username}
            layout="row"
            className="w-full"
          />
        );
      case "friend-request":
        return (
          <AcceptRejectFriendButtons
            profileUsername={action.username}
            className="w-full"
          />
        );
      default:
        return null;
    }
  })();

  const avatarNode = notification.actor?.avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={notification.actor.avatarUrl}
      alt={fallbackUsername || "notification"}
      className="h-full w-full rounded-full object-cover"
      referrerPolicy="no-referrer"
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials}
    </span>
  );

  const body = (
    <NotificationContent
      title={title}
      subtitle={subtitle}
      statusLabel={statusLabel}
      statusTone={statusTone}
      createdAt={notification.createdAt}
      isRead={notification.isRead}
      avatar={avatarNode}
    />
  );

  return (
    <li role="listitem" data-testid="navbar-notification-item">
      <div className="flex flex-col gap-3 px-4 py-3 transition hover:bg-accent/40">
        {postId ? (
          <button
            type="button"
            className="cursor-pointer flex w-full gap-3 text-left"
            aria-label={`${title} ${subtitle}`.trim() || "notification"}
            onClick={handlePostClick}
          >
            {body}
          </button>
        ) : (
          <Link
            href={profileHref}
            className="flex gap-3"
            aria-label={`${title} ${subtitle}`.trim() || "notification"}
            onClick={handleLinkClick}
          >
            {body}
          </Link>
        )}

        {actionContent && actionContent}
      </div>
    </li>
  );
}
