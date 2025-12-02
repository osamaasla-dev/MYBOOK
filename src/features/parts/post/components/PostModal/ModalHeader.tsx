"use client";

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
};

export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <header className="flex items-center justify-between border-b border-border p-3">
      <h2 className="m-auto text-lg font-semibold">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Close">
        <span className="text-2xl cursor-pointer rounded-full w-8 h-8 flex items-center justify-center  text-muted-foreground transition hover:bg-secondary">
          ×
        </span>
      </button>
    </header>
  );
}
