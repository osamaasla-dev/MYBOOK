"use client";

import type { ProfilePageState } from "./ProfilePageState";
import type { UpdateProfileInput } from "../../schemas/updateProfileSchema";
import type { ProfileUserRecord } from "../../types";

export interface ProfilePageHandlersProps {
  updateProfile: {
    mutateAsync: (
      data: UpdateProfileInput
    ) => Promise<Partial<ProfileUserRecord>>;
    mutate: (data: UpdateProfileInput) => void;
    isPending: boolean;
  };
  state: ProfilePageState;
}

export function ProfilePageHandlers({
  updateProfile,
  state,
}: ProfilePageHandlersProps) {
  // Success handlers
  const handleAvatarChange = async ({
    url,
    publicId,
  }: {
    url: string;
    publicId: string;
  }) => {
    await updateProfile.mutateAsync({
      avatarUrl: url,
      avatarPublicId: publicId,
    });
    state.setAvatarModalOpen(false);
  };

  const handleCoverChange = async ({
    url,
    publicId,
  }: {
    url: string;
    publicId: string;
  }) => {
    await updateProfile.mutateAsync({
      coverUrl: url,
      coverPublicId: publicId,
    });
    state.setCoverModalOpen(false);
  };

  // Remove handlers
  const handleAvatarRemove = () => {
    state.setAvatarConfirmOpen(true);
  };

  const handleCoverRemove = () => {
    state.setCoverConfirmOpen(true);
  };

  const confirmAvatarRemove = () => {
    updateProfile.mutate({
      avatarUrl: null,
      avatarPublicId: null,
    });
    state.setAvatarConfirmOpen(false);
  };

  const confirmCoverRemove = () => {
    updateProfile.mutate({
      coverUrl: null,
      coverPublicId: null,
    });
    state.setCoverConfirmOpen(false);
  };

  // Modal handlers
  const openAvatarModal = () => {
    state.setAvatarModalOpen(true);
  };

  const openCoverModal = () => {
    state.setCoverModalOpen(true);
  };

  const closeAvatarModal = () => {
    state.setAvatarModalOpen(false);
  };

  const closeCoverModal = () => {
    state.setCoverModalOpen(false);
  };

  return {
    handleAvatarChange,
    handleCoverChange,
    handleAvatarRemove,
    handleCoverRemove,
    confirmAvatarRemove,
    confirmCoverRemove,
    openAvatarModal,
    openCoverModal,
    closeAvatarModal,
    closeCoverModal,
  };
}
