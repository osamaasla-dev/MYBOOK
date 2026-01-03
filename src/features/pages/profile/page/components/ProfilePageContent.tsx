"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ProfileHero,
  ProfileSummary,
  ProfileActions,
  ProfileStats,
  ProfileActionsMenu,
} from "../../components";
import { ProfileBioTab } from "../../components/ProfileBioTab";
import { ProfilePostsTab } from "../../components/ProfilePostsTab";
import { ProfilePicturesTab } from "../../components/ProfilePicturesTab";
import type {
  ProfileSummary as ProfileSummaryType,
  ProfileViewerContext,
  ProfilePrivacyState,
} from "../../types";

export interface ProfilePageContentProps {
  profile: ProfileSummaryType;
  viewer: ProfileViewerContext;
  restrictions: ProfilePrivacyState["restrictions"];
  handlers: {
    handleAvatarRemove: () => void;
    handleCoverRemove: () => void;
    openAvatarModal: () => void;
    openCoverModal: () => void;
  };
  testId: string;
}

export function ProfilePageContent({
  profile,
  viewer,
  restrictions,
  handlers,
  testId,
}: ProfilePageContentProps) {
  return (
    <>
      <div
        className="space-y-6 bg-white pb-5 px-4 lg:px-8"
        role="region"
        aria-label="Profile header"
      >
        <div className="relative">
          <ProfileHero
            coverUrl={profile.coverUrl}
            avatarUrl={profile.avatarUrl}
            name={profile.name}
            testId={`${testId}-hero`}
          />
          {viewer.isSelf && (
            <div className="absolute bottom-4 right-4">
              <ProfileActionsMenu
                onAvatarChange={handlers.openAvatarModal}
                onCoverChange={handlers.openCoverModal}
                onAvatarRemove={handlers.handleAvatarRemove}
                onCoverRemove={handlers.handleCoverRemove}
                hasAvatar={!!profile.avatarUrl}
                hasCover={!!profile.coverUrl}
                testId={`${testId}-actions-menu`}
              />
            </div>
          )}
        </div>

        <div
          className="space-y-5"
          role="region"
          aria-label="Profile information"
        >
          <ProfileSummary
            profile={profile}
            restrictions={restrictions}
            testId={`${testId}-summary`}
          />
          <ProfileActions
            viewer={viewer}
            restrictions={restrictions}
            profileUsername={profile.username}
            testId={`${testId}-actions`}
          />
          <ProfileStats
            profile={profile}
            viewer={viewer}
            testId={`${testId}-stats`}
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        defaultValue="bio"
        className="w-full "
        data-testid={`${testId}-tabs`}
      >
        <TabsList
          className="grid w-full grid-cols-3 bg-white rounded-none py-0 h-fit relative before:content-[''] before:absolute before:top-0 before:left-1/2 before:transform before:-translate-x-1/2 before:w-3/4 before:h-0.5 before:bg-gray-300 shadow-md"
          role="tablist"
          aria-label="Profile sections"
        >
          <TabsTrigger
            value="bio"
            className="py-4"
            data-testid={`${testId}-tab-bio`}
          >
            Bio
          </TabsTrigger>
          <TabsTrigger
            value="posts"
            className="py-4"
            data-testid={`${testId}-tab-posts`}
          >
            Posts
          </TabsTrigger>
          <TabsTrigger
            value="pictures"
            className="py-4"
            data-testid={`${testId}-tab-pictures`}
          >
            Pictures
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="bio"
          className="mt-2 mx-30  bg-white  rounded-xl p-4"
          role="tabpanel"
          aria-labelledby={`${testId}-tab-bio`}
          data-testid={`${testId}-content-bio`}
        >
          <ProfileBioTab
            profile={profile}
            canViewFullProfile={viewer.canViewFullProfile}
          />
        </TabsContent>

        <TabsContent
          value="posts"
          className="mt-2 mx-30"
          role="tabpanel"
          aria-labelledby={`${testId}-tab-posts`}
          data-testid={`${testId}-content-posts`}
        >
          <ProfilePostsTab
            username={profile.username}
            profileUserId={profile.id}
          />
        </TabsContent>

        <TabsContent
          value="pictures"
          className="mt-2 mx-30 bg-white  rounded-xl p-4"
          role="tabpanel"
          aria-labelledby={`${testId}-tab-pictures`}
          data-testid={`${testId}-content-pictures`}
        >
          <ProfilePicturesTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
