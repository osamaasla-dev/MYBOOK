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
  testId?: string;
};

export function EmptyState({
  title,
  message,
  className,
  icon,
  actionLabel,
  onAction,
  children,
  testId = "empty-state",
}: EmptyStateProps) {
  const showAction = actionLabel && onAction;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/60 bg-white px-8 py-12 text-center shadow-sm",
        className
      )}
      data-testid={testId}
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
        <Button
          type="button"
          onClick={onAction}
          variant="default"
          data-testid={`${testId}-action`}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default EmptyState;
