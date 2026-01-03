import type { RefObject } from "react";

type RelationsListSentinelProps = {
  sentinelRef: RefObject<HTMLDivElement | null>;
  testId?: string;
};

export function RelationsListSentinel({
  sentinelRef,
  testId = "relations-list-sentinel",
}: RelationsListSentinelProps) {
  return (
    <div
      ref={sentinelRef}
      className="h-1 w-full"
      aria-hidden="true"
      data-testid={testId}
    />
  );
}
