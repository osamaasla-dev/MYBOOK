"use client";

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  testId?: string;
};

export function ModalHeader({ title, onClose, testId }: ModalHeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-border p-3"
      data-testid={testId || "modal-header"}
    >
      <h2
        className="m-auto text-lg font-semibold"
        id={testId ? `${testId}-title` : "modal-header-title"}
        data-testid={testId ? `${testId}-title` : "modal-header-title"}
      >
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close modal"
        aria-describedby={testId ? `${testId}-title` : "modal-header-title"}
        data-testid={testId ? `${testId}-close` : "modal-header-close"}
        className="text-2xl cursor-pointer rounded-full w-8 h-8 flex items-center justify-center text-muted-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>
  );
}
