"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/features/parts/post/components/PostCard/utils";

type NotificationContentProps = {
  title: string;
  subtitle: string;
  statusLabel?: string;
  statusTone?: string;
  createdAt: string;
  isRead: boolean;
  avatar: ReactNode;
};

export function NotificationContent({
  title,
  subtitle,
  statusLabel,
  statusTone,
  createdAt,
  isRead,
  avatar,
}: NotificationContentProps) {
  const relativeTime = formatRelativeTime(createdAt);

  return (
    <>
      <div
        className="relative h-10 w-10 shrink-0"
        data-testid="navbar-notification-avatar"
        aria-hidden="true"
      >
        {avatar}
      </div>

      <div className="min-w-0 flex-1" data-testid="navbar-notification-body">
        <p className="text-sm font-medium text-foreground">
          <span data-testid="navbar-notification-title">{title}</span>
          <span
            className="font-normal text-muted-foreground"
            data-testid="navbar-notification-subtitle"
          >
            {" "}
            {subtitle}
          </span>
        </p>
        <div className="mt-1 text-xs text-muted-foreground">
          <div data-testid="navbar-notification-time">{relativeTime}</div>
          {statusLabel && (
            <div
              className={cn(
                "font-semibold uppercase tracking-wide text-right",
                statusTone === "primary" && "text-primary",
                statusTone === "success" && "text-emerald-500",
                statusTone === "danger" && "text-danger"
              )}
              data-testid="navbar-notification-status"
            >
              {statusLabel}
            </div>
          )}
        </div>
      </div>

      {!isRead && (
        <span
          className="mt-1 inline-flex h-2 w-2 shrink-0 rounded-full bg-primary"
          aria-label="Unread notification"
          data-testid="navbar-notification-unread-indicator"
        />
      )}
    </>
  );
}
