import type { ReactNode } from "react";

import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

type PostModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  ariaLabel?: string;
  children: ReactNode;
  testId?: string;
};

export function PostModalShell({
  open,
  onClose,
  title,
  ariaLabel = "Create post editor",
  children,
  testId,
}: PostModalShellProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} ariaLabel={ariaLabel} testId={testId}>
      <ModalHeader
        title={title}
        onClose={onClose}
        testId={testId ? `${testId}-header` : "modal-header"}
      />
      <div
        data-testid={testId ? `${testId}-content` : "modal-content"}
        role="main"
        aria-labelledby={
          testId ? `${testId}-header-title` : "modal-header-title"
        }
      >
        {children}
      </div>
    </ModalShell>
  );
}
