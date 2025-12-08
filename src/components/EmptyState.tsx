import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

type EmptyStateProps = {
  title: string;
  message?: string;
  className?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
};

export function EmptyState({
  title,
  message,
  className,
  icon,
  actionLabel,
  onAction,
  children,
}: EmptyStateProps) {
  const showAction = actionLabel && onAction;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-card/80 px-8 py-12 text-center shadow-sm",
        className
      )}
      data-testid="empty-state"
    >
      {icon ? <div className="text-primary">{icon}</div> : null}
      <div className="space-y-2">
        <p className="text-lg font-semibold text-primary">{title}</p>
        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>

      {children}

      {showAction ? (
        <Button type="button" onClick={onAction} variant="default">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
