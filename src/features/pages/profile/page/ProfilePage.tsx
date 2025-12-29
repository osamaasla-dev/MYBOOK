"use client";

import { useState } from "react";
import { QueryError, QueryLoading } from "@/components";
import { ConfirmDialog } from "@/components/ConfirmDialog";

import { useProfile } from "../hooks/useProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { useCurrentUser } from "@/features/hooks/useCurrentUser";
import {
  ProfileHero,
  ProfileSummary,
  ProfileActions,
  ProfileStats,
  ProfileAbout,
  ProfileActionsMenu,
  ImageUploadModal,
} from "../components";

type ProfilePageProps = {
  username: string;
};

export function ProfilePage({ username }: ProfilePageProps) {
  const { data, isLoading, isError, error, refetch } = useProfile(
    username,
    Boolean(username)
  );

  const { data: currentUser } = useCurrentUser();

  const updateProfile = useUpdateProfile(currentUser?.id || "", username);

  // Modal states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Confirm dialog states
  const [isAvatarConfirmOpen, setIsAvatarConfirmOpen] = useState(false);
  const [isCoverConfirmOpen, setIsCoverConfirmOpen] = useState(false);

  // Success handlers
  const handleAvatarChange = async (url: string) => {
    await updateProfile.mutateAsync({ avatarUrl: url });
  };

  const handleCoverChange = async (url: string) => {
    await updateProfile.mutateAsync({ coverUrl: url });
  };

  // Remove handlers
  const handleAvatarRemove = () => {
    setIsAvatarConfirmOpen(true);
  };

  const handleCoverRemove = () => {
    setIsCoverConfirmOpen(true);
  };

  const confirmAvatarRemove = () => {
    updateProfile.mutate({ avatarUrl: null });
  };

  const confirmCoverRemove = () => {
    updateProfile.mutate({ coverUrl: null });
  };

  if (isLoading) {
    return <QueryLoading message="Loading profile..." />;
  }

  if (isError || !data) {
    return (
      <QueryError
        message={error?.message ?? "Error loading profile"}
        onRetry={() => refetch()}
      />
    );
  }

  const { profile, viewer, restrictions } = data;

  return (
    <div className="space-y-6 bg-white">
      <div className="relative">
        <ProfileHero
          coverUrl={profile.coverUrl}
          avatarUrl={profile.avatarUrl}
          name={profile.name}
        />
        {viewer.isSelf && (
          <div className="absolute bottom-4 right-4">
            <ProfileActionsMenu
              onAvatarChange={() => setIsAvatarModalOpen(true)}
              onCoverChange={() => setIsCoverModalOpen(true)}
              onAvatarRemove={handleAvatarRemove}
              onCoverRemove={handleCoverRemove}
              hasAvatar={!!profile.avatarUrl}
              hasCover={!!profile.coverUrl}
            />
          </div>
        )}
      </div>

      <div className="space-y-5">
        <ProfileSummary profile={profile} restrictions={restrictions} />
        <ProfileActions
          viewer={viewer}
          restrictions={restrictions}
          profileUsername={profile.username}
        />
        <ProfileStats profile={profile} viewer={viewer} />
        <ProfileAbout
          profile={profile}
          canViewFullProfile={viewer.canViewFullProfile}
        />
      </div>

      {/* Image Upload Modals */}
      <ImageUploadModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Change Avatar"
        onSuccess={handleAvatarChange}
      />

      <ImageUploadModal
        isOpen={isCoverModalOpen}
        onClose={() => setIsCoverModalOpen(false)}
        title="Change Cover"
        onSuccess={handleCoverChange}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        title="Remove Avatar"
        description="Are you sure you want to remove your avatar? This action cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isConfirming={updateProfile.isPending}
        onConfirm={confirmAvatarRemove}
        open={isAvatarConfirmOpen}
        onOpenChange={setIsAvatarConfirmOpen}
      />

      <ConfirmDialog
        title="Remove Cover"
        description="Are you sure you want to remove your cover image? This action cannot be undone."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        confirmVariant="danger"
        isConfirming={updateProfile.isPending}
        onConfirm={confirmCoverRemove}
        open={isCoverConfirmOpen}
        onOpenChange={setIsCoverConfirmOpen}
      />
    </div>
  );
}
