import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type QueryLoadingProps = {
  message?: string;
  className?: string;
};

export function QueryLoading({
  message = "Loading...",
  className,
}: QueryLoadingProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="query-loading"
      className={cn(
        "flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-white)] px-4 py-3 text-[var(--color-foreground)] shadow-sm",
        className
      )}
    >
      <Loader2
        className="h-5 w-5 animate-spin text-[var(--color-primary)]"
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default QueryLoading;
