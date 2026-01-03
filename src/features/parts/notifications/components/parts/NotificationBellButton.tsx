import { forwardRef } from "react";
import { Bell, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type NotificationBellButtonProps = {
  isBusy: boolean;
  unreadCount: number;
  isOpen?: boolean;
  testId?: string;
} & React.ComponentPropsWithoutRef<"button">;

export const NotificationBellButton = forwardRef<
  HTMLButtonElement,
  NotificationBellButtonProps
>(function NotificationBellButtonInner(
  {
    isBusy,
    unreadCount,
    isOpen = false,
    testId = "navbar-notifications-trigger",
    ...props
  },
  ref
) {
  const unreadLabel =
    unreadCount === 1
      ? "1 unread notification"
      : `${unreadCount} unread notifications`;
  const ariaLabel = isBusy
    ? "Loading notifications"
    : unreadCount > 0
    ? `Notifications, ${unreadLabel}`
    : "Notifications";

  return (
    <Button
      ref={ref}
      className=" relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-dark transition hover:bg-accent-light"
      size="icon"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      aria-busy={isBusy}
      data-testid={testId}
      {...props}
    >
      {isBusy ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <Bell
          className={isOpen ? "h-5 w-5 rotate-180" : "h-5 w-5"}
          aria-hidden="true"
        />
      )}

      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 inline-flex h-3 w-3 rounded-full  bg-danger"
          aria-label={unreadLabel}
          data-testid={`${testId}-unread-indicator`}
        />
      )}
    </Button>
  );
});
