import { RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NOTIFICATION_TAB_VALUES, type NotificationTab } from "../../constants";

type NotificationDropdownHeaderProps = {
  onRefresh: () => void;
  tab: NotificationTab;
  onTabChange: (tab: NotificationTab) => void;
};

export function NotificationDropdownHeader({
  onRefresh,
  tab,
  onTabChange,
}: NotificationDropdownHeaderProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-border px-4 py-3">
      <div className="flex items-center justify-between">
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

      <Tabs
        value={tab}
        onValueChange={(value) => onTabChange(value as NotificationTab)}
      >
        <TabsList className="w-full flex gap-1">
          {NOTIFICATION_TAB_VALUES.map((value) => (
            <TabsTrigger
              key={value}
              value={value}
              className="cursor-pointer rounded-md px-3 py-1 text-xs transition-colors  data-[state=active]:border-primary data-[state=active]:bg-primary/10 hover:border-primary hover:bg-primary/10"
            >
              {value}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
