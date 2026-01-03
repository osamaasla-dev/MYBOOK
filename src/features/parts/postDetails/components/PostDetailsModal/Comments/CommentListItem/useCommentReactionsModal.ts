"use client";

import { useCallback, useState } from "react";

export function useCommentReactionsModal() {
  const [isReactionsModalOpen, setIsReactionsModalOpen] = useState(false);

  const openReactionsModal = useCallback(() => {
    setIsReactionsModalOpen(true);
  }, []);

  const closeReactionsModal = useCallback(() => {
    setIsReactionsModalOpen(false);
  }, []);

  return {
    isReactionsModalOpen,
    openReactionsModal,
    closeReactionsModal,
  };
}
