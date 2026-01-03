import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type QueryLoadingProps = {
  message?: string;
  className?: string;
  testId?: string;
};

export function QueryLoading({
  message = "Loading...",
  className,
  testId = "query-loading",
}: QueryLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid={testId}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-foreground shadow-sm",
        className
      )}
    >
      <Loader2
        className="h-5 w-5 animate-spin text-primary"
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default QueryLoading;
