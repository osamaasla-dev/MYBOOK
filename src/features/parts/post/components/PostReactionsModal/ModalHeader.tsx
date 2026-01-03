import { X } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

type ModalHeaderProps = {
  title: string;
  testId?: string;
};

export function ModalHeader({ title, testId }: ModalHeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-border/60 px-3 py-1"
      data-testid={testId ? `${testId}-header` : "post-reactions-header"}
    >
      <Dialog.Title
        className="text-lg font-semibold text-foreground"
        id={testId ? `${testId}-title` : "post-reactions-title"}
        data-testid={testId ? `${testId}-title` : "post-reactions-title"}
      >
        {title}
      </Dialog.Title>
      <Dialog.Close asChild>
        <button
          type="button"
          className="cursor-pointer flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Close reactions modal"
          data-testid={testId ? `${testId}-close` : "post-reactions-close"}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </Dialog.Close>
    </header>
  );
}
