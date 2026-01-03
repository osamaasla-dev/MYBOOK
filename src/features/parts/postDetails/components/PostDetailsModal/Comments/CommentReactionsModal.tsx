"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import type { ReactionSummary } from "@/features/parts/post/utils/reaction";
import { CommentReactionTab } from "../../../services/server/comment/reactions/schema";
import { CommentReactionsModalContent } from "./CommentReactionsModal/index";

const MODAL_TITLE = "Comment reactions";

export type CommentReactionsModalProps = {
  postId: string;
  commentId: string;
  open: boolean;
  onClose: () => void;
  initialTab?: CommentReactionTab;
  initialSummary?: ReactionSummary | null;
};

export function CommentReactionsModal({
  postId,
  commentId,
  open,
  onClose,
  initialTab = "all",
  initialSummary = null,
}: CommentReactionsModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          data-testid="comment-reactions-modal-overlay"
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl border border-border/60 bg-white shadow-2xl outline-none focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90"
          aria-modal="true"
          aria-labelledby="comment-reactions-modal-title"
          aria-describedby="comment-reactions-modal-description"
          data-testid="comment-reactions-modal-content"
          data-modal-type="comment-reactions"
        >
          <header className="flex items-center justify-between border-b border-border/60 px-3 py-1">
            <Dialog.Title
              className="text-lg font-semibold text-foreground"
              id="comment-reactions-modal-title"
            >
              {MODAL_TITLE}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="cursor-pointer flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Close reactions modal"
                data-testid="comment-reactions-modal-close"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </header>

          <CommentReactionsModalContent
            postId={postId}
            commentId={commentId}
            open={open}
            initialTab={initialTab}
            initialSummary={initialSummary}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
