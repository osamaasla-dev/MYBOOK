"use client";

import type { PropsWithChildren } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";

type ModalShellProps = PropsWithChildren<{
  onClose: () => void;
  ariaLabel?: string;
  testId?: string;
}>;

export function ModalShell({
  children,
  onClose,
  ariaLabel,
  testId,
}: ModalShellProps) {
  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
          data-testid={testId ? `${testId}-backdrop` : "modal-backdrop"}
        />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl outline-none focus-visible:outline-none focus-visible:ring-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:zoom-in-90 data-[state=closed]:zoom-out-90"
          aria-label={ariaLabel ?? "Create post editor"}
          data-testid={testId || "modal-shell"}
        >
          <VisuallyHidden>
            <Dialog.Title>{ariaLabel ?? "Create post editor"}</Dialog.Title>
          </VisuallyHidden>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
