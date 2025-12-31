"use client";

import { useState } from "react";
import { QueryError, QueryLoading } from "@/components";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { useProfile } from "../hooks/useProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import {
  ProfileHero,
  ProfileSummary,
  ProfileActions,
  ProfileStats,
  ProfileActionsMenu,
  ImageUploadModal,
} from "../components";
import { ProfileBioTab } from "../components/ProfileBioTab";
import { ProfilePostsTab } from "../components/ProfilePostsTab";
import { ProfilePicturesTab } from "../components/ProfilePicturesTab";
import { ClientSession } from "@/utils/session";

type ProfilePageProps = {
  username: string;
};

export function ProfilePage({ username }: ProfilePageProps) {
  const { data, isLoading, isError, error, refetch } = useProfile(
    username,
    Boolean(username)
  );

  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";

  const updateProfile = useUpdateProfile(userId, username);

  // Modal states
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  // Confirm dialog states
  const [isAvatarConfirmOpen, setIsAvatarConfirmOpen] = useState(false);
  const [isCoverConfirmOpen, setIsCoverConfirmOpen] = useState(false);

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
  };

  // Remove handlers
  const handleAvatarRemove = () => {
    setIsAvatarConfirmOpen(true);
  };

  const handleCoverRemove = () => {
    setIsCoverConfirmOpen(true);
  };

  const confirmAvatarRemove = () => {
    updateProfile.mutate({ avatarUrl: null, avatarPublicId: null });
  };

  const confirmCoverRemove = () => {
    updateProfile.mutate({ coverUrl: null, coverPublicId: null });
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
    <div className=" ">
      <div className="space-y-6 bg-white pb-5 px-4 lg:px-8">
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
        </div>
      </div>
      {/* Tabs */}
      <Tabs defaultValue="bio" className="w-full ">
        <TabsList className="grid w-full grid-cols-3 bg-white rounded-none py-0 h-fit relative before:content-[''] before:absolute before:top-0 before:left-1/2 before:transform before:-translate-x-1/2 before:w-3/4 before:h-0.5 before:bg-gray-300 shadow-md">
          <TabsTrigger value="bio" className="py-4">
            Bio
          </TabsTrigger>
          <TabsTrigger value="posts" className="py-4">
            Posts
          </TabsTrigger>
          <TabsTrigger value="pictures" className="py-4">
            Pictures
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="bio"
          className="mt-2 mx-30  bg-white  rounded-xl p-4"
        >
          <ProfileBioTab
            profile={profile}
            canViewFullProfile={viewer.canViewFullProfile}
          />
        </TabsContent>

        <TabsContent value="posts" className="mt-2 mx-30">
          <ProfilePostsTab
            username={profile.username}
            profileUserId={profile.id}
          />
        </TabsContent>

        <TabsContent
          value="pictures"
          className="mt-2 mx-30 bg-white  rounded-xl p-4"
        >
          <ProfilePicturesTab />
        </TabsContent>
      </Tabs>
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
