import type { ProfileRouteData } from "../types";

const statClasses =
  "flex flex-col items-center rounded-xl border border-border/60 bg-white px-4 py-3 text-center";

type ProfileStatsProps = {
  profile: ProfileRouteData["profile"];
};

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    { label: "Followers", value: profile.followersCount },
    { label: "Following", value: profile.followingCount },
    { label: "Posts", value: profile.postsCount },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className={statClasses}>
          <span className="text-2xl font-bold text-primary-dark">
            {stat.value.toLocaleString("ar-EG")}
          </span>
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            {stat.label}
          </span>
        </div>
      ))}
    </div>
  );
}
