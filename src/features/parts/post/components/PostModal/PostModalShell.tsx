import type { ReactNode } from "react";

import { ModalHeader } from "./ModalHeader";
import { ModalShell } from "./ModalShell";

type PostModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  ariaLabel?: string;
  children: ReactNode;
};

export function PostModalShell({
  open,
  onClose,
  title,
  ariaLabel = "Create post editor",
  children,
}: PostModalShellProps) {
  if (!open) {
    return null;
  }

  return (
    <ModalShell onClose={onClose} ariaLabel={ariaLabel}>
      <ModalHeader title={title} onClose={onClose} />
      {children}
    </ModalShell>
  );
}
