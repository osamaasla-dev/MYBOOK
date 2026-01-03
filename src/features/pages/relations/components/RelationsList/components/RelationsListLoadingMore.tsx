import { Loader2 } from "lucide-react";

type RelationsListLoadingMoreProps = {
  testId?: string;
};

export function RelationsListLoadingMore({
  testId = "relations-list-loading-more",
}: RelationsListLoadingMoreProps) {
  return (
    <div
      className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-muted-foreground"
      data-testid={testId}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      Loading more...
    </div>
  );
}
