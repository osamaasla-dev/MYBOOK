"use client";

import Link from "next/link";
import { useCallback } from "react";

import { usePostDetailsModalNavigation } from "@/features/parts/postDetails/hooks";
import {
  NotificationItemProps,
  NotificationBody,
  useNotificationData,
  NotificationAvatar,
  NotificationAction,
} from "./NotificationItem/index";

export function NotificationItem({
  notification,
  onSelect,
  testId = "navbar-notification-item",
}: NotificationItemProps) {
  const notificationData = useNotificationData(notification);
  const { openPostDetails } = usePostDetailsModalNavigation();

  const handlePostClick = useCallback(() => {
    if (!notificationData.postId) return;
    openPostDetails(notificationData.postId);
    onSelect?.(notification);
  }, [notification, onSelect, openPostDetails, notificationData.postId]);

  const handleLinkClick = useCallback(() => {
    onSelect?.(notification);
  }, [notification, onSelect]);

  const avatarNode = (
    <NotificationAvatar
      notification={notification}
      initials={notificationData.initials}
      fallbackUsername={notificationData.fallbackUsername}
    />
  );

  const body = (
    <NotificationBody
      title={notificationData.title}
      subtitle={notificationData.subtitle}
      statusLabel={notificationData.statusLabel}
      statusTone={notificationData.statusTone}
      createdAt={notification.createdAt}
      isRead={notification.isRead}
      avatar={avatarNode}
    />
  );

  return (
    <li role="listitem" data-testid={testId}>
      <div className="flex flex-col gap-3 px-4 py-3 transition hover:bg-accent/40">
        {notificationData.postId ? (
          <button
            type="button"
            className="cursor-pointer flex w-full gap-3 text-left"
            aria-label={
              `${notificationData.title} ${notificationData.subtitle}`.trim() ||
              "notification"
            }
            onClick={handlePostClick}
          >
            {body}
          </button>
        ) : (
          <Link
            href={notificationData.profileHref}
            className="flex gap-3"
            aria-label={
              `${notificationData.title} ${notificationData.subtitle}`.trim() ||
              "notification"
            }
            onClick={handleLinkClick}
          >
            {body}
          </Link>
        )}

        <NotificationAction action={notificationData.action} />
      </div>
    </li>
  );
}
