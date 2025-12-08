"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

import type { PublishProgress } from "./hooks/publishing";

type PostActionsProps = {
  canPublish: boolean;
  isPublishing: boolean;
  progress: PublishProgress | null;
  onPublish: () => void;
  onResetDraft: () => void;
};

export function PostActions({
  canPublish,
  isPublishing,
  progress,
  onPublish,
  onResetDraft,
}: PostActionsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 pt-2">
      {progress && (
        <div className="flex w-full flex-col gap-1" aria-live="polite">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progress.label}</span>
            <span>{progress.value}%</span>
          </div>

          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress.value}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <ConfirmDialog
          title="Discard draft?"
          description="Your current text and visibility settings will be cleared. This action can't be undone."
          confirmLabel="Confirm"
          confirmVariant="reject"
          cancelLabel="Cancel"
          onConfirm={onResetDraft}
          trigger={
            <Button
              type="button"
              variant="secondary"
              className="text-muted-foreground"
            >
              Clear draft
            </Button>
          }
        />

        <button
          type="button"
          onClick={onPublish}
          className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPublishing || !canPublish}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
