"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/button";

type PostActionsProps = {
  canPublish: boolean;
  isPublishing: boolean;

  onPublish: () => void;
  onResetDraft: () => void;
};

export function PostActions({
  canPublish,
  isPublishing,

  onPublish,
  onResetDraft,
}: PostActionsProps) {
  return (
    <div className="flex flex-col gap-3 p-4 pt-2">
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
