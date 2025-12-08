"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariant = React.ComponentProps<typeof Button>["variant"];

export type ConfirmDialogProps = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  isConfirming?: boolean;
  onConfirm: () => void | Promise<void>;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  className?: string;
};

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "destructive",
  isConfirming = false,
  onConfirm,
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  className,
}: ConfirmDialogProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen ?? false);
  const isControlled = open !== undefined;
  const resolvedOpen = isControlled ? open : internalOpen;

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange]
  );

  const handleConfirmClick = useCallback(async () => {
    if (isConfirming) return;
    await onConfirm();
    handleOpenChange(false);
  }, [handleOpenChange, isConfirming, onConfirm]);

  return (
    <DialogPrimitive.Root open={resolvedOpen} onOpenChange={handleOpenChange}>
      {trigger ? (
        <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      ) : null}

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-6 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            className
          )}
        >
          <div className="flex items-start justify-between gap-4 ">
            <div className="space-y-2">
              <DialogPrimitive.Title className="text-base font-semibold text-foreground">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>

            <DialogPrimitive.Close className="cursor-pointer rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>

          <div className="mt-6 flex flex-row-reverse flex-wrap gap-3">
            <Button
              variant={confirmVariant}
              onClick={handleConfirmClick}
              disabled={isConfirming}
            >
              {isConfirming ? "Processing..." : confirmLabel}
            </Button>

            <DialogPrimitive.Close asChild>
              <Button variant="ghost" disabled={isConfirming}>
                {cancelLabel}
              </Button>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
