"use client";

import { QueryError, QueryLoading } from "@/components";

import { useProfile } from "../hooks/useProfile";
import {
  ProfileHero,
  ProfileSummary,
  ProfileActions,
  ProfileStats,
  ProfileAbout,
} from "../components";

type ProfilePageProps = {
  username: string;
};

export function ProfilePage({ username }: ProfilePageProps) {
  const { data, isLoading, isError, error, refetch } = useProfile(
    username,
    Boolean(username)
  );

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
    <div className="space-y-6">
      <ProfileHero
        coverUrl={profile.coverUrl}
        avatarUrl={profile.avatarUrl}
        name={profile.name}
      />

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
    </div>
  );
}
