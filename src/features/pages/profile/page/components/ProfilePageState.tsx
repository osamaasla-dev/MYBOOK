"use client";

import { useState } from "react";

export interface ProfilePageState {
  // Modal states
  isAvatarModalOpen: boolean;
  isCoverModalOpen: boolean;

  // Confirm dialog states
  isAvatarConfirmOpen: boolean;
  isCoverConfirmOpen: boolean;

  // Actions
  setAvatarModalOpen: (open: boolean) => void;
  setCoverModalOpen: (open: boolean) => void;
  setAvatarConfirmOpen: (open: boolean) => void;
  setCoverConfirmOpen: (open: boolean) => void;
}

export function useProfilePageState(): ProfilePageState {
  // Modal states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Confirm dialog states
  const [isAvatarConfirmOpen, setIsAvatarConfirmOpen] = useState(false);
  const [isCoverConfirmOpen, setIsCoverConfirmOpen] = useState(false);

  return {
    // Modal states
    isAvatarModalOpen,
    isCoverModalOpen,

    // Confirm dialog states
    isAvatarConfirmOpen,
    isCoverConfirmOpen,

    // Actions
    setAvatarModalOpen: setIsAvatarModalOpen,
    setCoverModalOpen: setIsCoverModalOpen,
    setAvatarConfirmOpen: setIsAvatarConfirmOpen,
    setCoverConfirmOpen: setIsCoverConfirmOpen,
  };
}
