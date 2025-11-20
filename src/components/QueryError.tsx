import { AlertTriangle } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type QueryErrorProps = {
  message?: string;
  title?: string;
  className?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

export function QueryError({
  message,
  title = "Error loading data",
  className,
  onRetry,
  retryLabel = "Retry",
}: QueryErrorProps) {
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = `${generatedId}-description`;
  const resolvedMessage = message ?? "Something went wrong. Please try again.";

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-testid="query-error"
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-[var(--color-foreground)] shadow-sm",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 text-destructive"
          aria-hidden="true"
        />
        <div>
          <p id={titleId} className="text-sm font-semibold text-destructive">
            {title}
          </p>
          <p
            id={descriptionId}
            className="text-sm text-[var(--color-muted-foreground)]"
          >
            {resolvedMessage}
          </p>
        </div>
      </div>

      {onRetry ? (
        <Button
          type="button"
          onClick={onRetry}
          data-testid="query-error-retry"
          className="self-start"
        >
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}

export default QueryError;
