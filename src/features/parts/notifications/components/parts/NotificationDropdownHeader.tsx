import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type NotificationDropdownHeaderProps = {
  onRefresh: () => void;
};

export function NotificationDropdownHeader({
  onRefresh,
}: NotificationDropdownHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-3">
      <p className="text-sm font-semibold text-primary-dark">Notifications</p>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-8 gap-1 text-xs"
        onClick={onRefresh}
        aria-label="Refresh notifications"
        data-testid="navbar-notifications-refresh"
      >
        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
        Refresh
      </Button>
    </div>
  );
}
