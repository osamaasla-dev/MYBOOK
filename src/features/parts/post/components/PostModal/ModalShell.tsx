"use client";

import type { PropsWithChildren } from "react";

type ModalShellProps = PropsWithChildren<{
  onClose: () => void;
  ariaLabel?: string;
}>;

export function ModalShell({ children, onClose, ariaLabel }: ModalShellProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none focus-visible:outline-none focus-visible:ring-0"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? "Create post editor"}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl outline-none focus-visible:outline-none focus-visible:ring-0">
        {children}
      </div>
    </div>
  );
}
