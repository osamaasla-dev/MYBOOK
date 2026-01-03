"use client";

import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ShareButton({ testId }: { testId?: string }) {
  return (
    <Button
      type="button"
      className="flex flex-1 items-center justify-center rounded-md bg-transparent px-2 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-secondary"
      data-testid={testId}
      aria-label="Share post"
    >
      <Share2
        className="mr-2 size-4"
        aria-hidden="true"
        data-testid={`${testId}-icon`}
      />
      <span className="font-semibold" data-testid={`${testId}-text`}>
        Share
      </span>
    </Button>
  );
}
