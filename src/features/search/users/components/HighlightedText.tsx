"use client";

import { cn } from "@/lib/utils";

import type { AlgoliaHighlightFragment } from "../types";

type HighlightedTextProps = {
  fragment?: AlgoliaHighlightFragment;
  fallback?: string | null;
  className?: string;
  "data-testid"?: string;
};

export function HighlightedText({
  fragment,
  fallback,
  className,
  "data-testid": dataTestId,
}: HighlightedTextProps) {
  if (fragment?.value) {
    return (
      <span
        className={cn("leading-tight", className)}
        dangerouslySetInnerHTML={{ __html: fragment.value }}
        data-testid={dataTestId}
      />
    );
  }

  return (
    <span className={cn("leading-tight", className)} data-testid={dataTestId}>
      {fallback ?? ""}
    </span>
  );
}
