import Link from "next/link";

import type { ProfileRouteData } from "../types";

type ProfileBioTabProps = {
  profile: ProfileRouteData["profile"];
  canViewFullProfile: boolean;
};

export function ProfileBioTab({
  profile,
  canViewFullProfile,
}: ProfileBioTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-primary-dark mb-4">
          About {profile.name}
        </h2>
        <p className="text-gray-700 leading-relaxed">
          {profile.bio && canViewFullProfile ? profile.bio : "no bio available"}
        </p>
      </div>

      <div className="space-y-2 text-sm pt-4 border-t border-gray-200">
        <p className="text-gray-600">
          <span className="font-medium">Joined:</span>{" "}
          {new Date(profile.createdAt).toLocaleDateString("ar-EG")}
        </p>
        {canViewFullProfile && profile.websiteUrl ? (
          <div>
            <span className="font-medium text-gray-600">Website:</span>{" "}
            <Link
              href={profile.websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline ml-1"
            >
              {profile.websiteUrl}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
