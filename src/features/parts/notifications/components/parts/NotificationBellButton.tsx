import { forwardRef } from "react";
import { Bell, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type NotificationBellButtonProps = {
  isBusy: boolean;
  unreadCount: number;
  isOpen?: boolean;
} & React.ComponentPropsWithoutRef<"button">;

export const NotificationBellButton = forwardRef<
  HTMLButtonElement,
  NotificationBellButtonProps
>(function NotificationBellButtonInner(
  { isBusy, unreadCount, isOpen = false, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      className=" relative flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-dark transition hover:bg-accent-light"
      size="icon"
      aria-label="notifications"
      data-testid="navbar-notifications-trigger"
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
          aria-label="Unread notifications"
          data-testid="navbar-notifications-unread-indicator"
        />
      )}
    </Button>
  );
});
