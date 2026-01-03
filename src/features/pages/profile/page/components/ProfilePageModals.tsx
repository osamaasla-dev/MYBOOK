"use client";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ImageUploadModal } from "../../components";

export interface ProfilePageModalsProps {
  state: {
    isAvatarModalOpen: boolean;
    isCoverModalOpen: boolean;
    isAvatarConfirmOpen: boolean;
    isCoverConfirmOpen: boolean;
    setAvatarModalOpen: (open: boolean) => void;
    setCoverModalOpen: (open: boolean) => void;
    setAvatarConfirmOpen: (open: boolean) => void;
    setCoverConfirmOpen: (open: boolean) => void;
  };
  handlers: {
    handleAvatarChange: (data: {
      url: string;
      publicId: string;
    }) => Promise<void>;
    handleCoverChange: (data: {
      url: string;
      publicId: string;
    }) => Promise<void>;
    confirmAvatarRemove: () => void;
    confirmCoverRemove: () => void;
  };
  updateProfile: {
    isPending: boolean;
  };
  testId: string;
}

export function ProfilePageModals({
  state,
  handlers,
  updateProfile,
  testId,
}: ProfilePageModalsProps) {
  return (
    <>
      {/* Image Upload Modals */}
      <ImageUploadModal
        isOpen={state.isAvatarModalOpen}
        onClose={() => state.setAvatarModalOpen(false)}
        title="Change Avatar"
        onSuccess={handlers.handleAvatarChange}
        testId={`${testId}-avatar-modal`}
      />

      <ImageUploadModal
        isOpen={state.isCoverModalOpen}
        onClose={() => state.setCoverModalOpen(false)}
        title="Change Cover"
        onSuccess={handlers.handleCoverChange}
        testId={`${testId}-cover-modal`}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        title="Remove Avatar"
        description="Are you sure you want to remove your avatar? This action cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isConfirming={updateProfile.isPending}
        onConfirm={handlers.confirmAvatarRemove}
        open={state.isAvatarConfirmOpen}
        onOpenChange={state.setAvatarConfirmOpen}
        testId={`${testId}-avatar-confirm`}
      />

      <ConfirmDialog
        title="Remove Cover"
        description="Are you sure you want to remove your cover image? This action cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isConfirming={updateProfile.isPending}
        onConfirm={handlers.confirmCoverRemove}
        open={state.isCoverConfirmOpen}
        onOpenChange={state.setCoverConfirmOpen}
        testId={`${testId}-cover-confirm`}
      />
    </>
  );
}
