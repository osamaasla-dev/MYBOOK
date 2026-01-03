"use client";

import { QueryError, QueryLoading } from "@/components";

import { useProfile } from "../hooks/useProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { ClientSession } from "@/utils/session";
import {
  useProfilePageState,
  ProfilePageHandlers,
  ProfilePageContent,
  ProfilePageModals,
} from "./components";

type ProfilePageProps = {
  username: string;
  testId?: string;
};

export function ProfilePage({
  username,
  testId = "profile-page",
}: ProfilePageProps) {
  const { data, isLoading, isError, error, refetch } = useProfile(
    username,
    Boolean(username)
  );

  const { data: session } = ClientSession();
  const userId = session?.user?.id || "";

  const updateProfile = useUpdateProfile(userId, username);

  // State management
  const state = useProfilePageState();

  // Event handlers
  const handlers = ProfilePageHandlers({
    updateProfile,
    state,
  });

  if (isLoading) {
    return (
      <QueryLoading message="Loading profile..." testId={`${testId}-loading`} />
    );
  }

  if (isError || !data) {
    return (
      <QueryError
        message={error?.message ?? "Error loading profile"}
        onRetry={() => refetch()}
        testId={`${testId}-error`}
      />
    );
  }

  const { profile, viewer, restrictions } = data;

  return (
    <div
      className=" "
      role="main"
      aria-label={`${profile.name || profile.username} profile`}
      data-testid={testId}
    >
      <ProfilePageContent
        profile={profile}
        viewer={viewer}
        restrictions={restrictions}
        handlers={{
          handleAvatarRemove: handlers.handleAvatarRemove,
          handleCoverRemove: handlers.handleCoverRemove,
          openAvatarModal: handlers.openAvatarModal,
          openCoverModal: handlers.openCoverModal,
        }}
        testId={testId}
      />

      <ProfilePageModals
        state={state}
        handlers={{
          handleAvatarChange: handlers.handleAvatarChange,
          handleCoverChange: handlers.handleCoverChange,
          confirmAvatarRemove: handlers.confirmAvatarRemove,
          confirmCoverRemove: handlers.confirmCoverRemove,
        }}
        updateProfile={updateProfile}
        testId={testId}
      />
    </div>
  );
}
