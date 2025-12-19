"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

type PostDetailsHeaderProps = {
  onClose: () => void;
};

export function PostDetailsHeader({ onClose }: PostDetailsHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border/60 px-2">
      <Dialog.Title className="text-lg font-semibold text-foreground">
        Post details
      </Dialog.Title>
      <Dialog.Close asChild>
        <button
          type="button"
          className="cursor-pointer flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          aria-label="Close post details"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </Dialog.Close>
    </header>
  );
}
