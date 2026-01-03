"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

type PostActionsProps = {
  canPublish: boolean;
  isPublishing: boolean;

  onPublish: () => void;
  onResetDraft: () => void;
  testId?: string;
};

export function PostActions({
  canPublish,
  isPublishing,

  onPublish,
  onResetDraft,
  testId,
}: PostActionsProps) {
  return (
    <div
      className="flex flex-col gap-3 p-4 pt-2"
      role="group"
      aria-label="Post publishing actions"
      data-testid={testId || "post-actions"}
    >
      <div className="flex items-center justify-between gap-3">
        <ConfirmDialog
          title="Discard draft?"
          description="Your current text and visibility settings will be cleared. This action can't be undone."
          confirmLabel="Confirm"
          confirmVariant="danger"
          cancelLabel="Cancel"
          onConfirm={onResetDraft}
          trigger={
            <Button
              type="button"
              variant="secondary"
              className="text-muted-foreground"
              aria-label="Clear draft and discard changes"
              data-testid={
                testId ? `${testId}-clear-draft` : "post-clear-draft"
              }
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
          aria-label={
            isPublishing ? "Publishing post, please wait" : "Publish post"
          }
          aria-busy={isPublishing}
          data-testid={testId ? `${testId}-publish` : "post-publish"}
        >
          {isPublishing ? "Publishing..." : "Publish"}
        </button>
      </div>
    </div>
  );
}
