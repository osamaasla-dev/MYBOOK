import Link from "next/link";

import type { ProfileRouteData } from "../types";

type ProfileAboutProps = {
  profile: ProfileRouteData["profile"];
  canViewFullProfile: boolean;
  testId?: string;
};

export function ProfileAbout({
  profile,
  canViewFullProfile,
  testId = "profile-about",
}: ProfileAboutProps) {
  return (
    <div
      className="space-y-4 rounded-xl border border-border/60 bg-surface p-5 shadow-sm"
      data-testid={testId}
    >
      <div>
        <h2
          className="text-lg font-semibold text-primary-dark"
          data-testid={`${testId}-title`}
        >
          About {profile.name}
        </h2>
        <p
          className="text-sm text-muted-foreground"
          data-testid={`${testId}-bio`}
        >
          {profile.bio && canViewFullProfile ? profile.bio : "no bio available"}
        </p>
      </div>

      <div className="space-y-1 text-sm">
        <p
          className="text-muted-foreground"
          data-testid={`${testId}-joined-date`}
        >
          joined {new Date(profile.createdAt).toLocaleDateString("ar-EG")}
        </p>
        {canViewFullProfile && profile.websiteUrl ? (
          <Link
            href={profile.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
            data-testid={`${testId}-website`}
          >
            {profile.websiteUrl}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
