"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type PostDetailsModalProps = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

export function PostDetailsModal({
  postId,
  open,
  onClose,
}: PostDetailsModalProps) {
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-border/60 bg-white shadow-2xl outline-none focus-visible:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90">
          <header className="flex items-center justify-between border-b border-border/60 px-5 py-3">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Post details
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                className="cursor-pointer flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                aria-label="Close post details"
              >
                <X className="size-4" />
              </button>
            </Dialog.Close>
          </header>

          <section className="px-6 py-8">
            <div className="rounded-2xl border border-dashed border-border/60 bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
              Post details modal placeholder for <strong>{postId}</strong>.
            </div>
          </section>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
