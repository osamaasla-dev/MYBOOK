import type { ProfileRouteData } from "../types";

const badgeBase =
  "inline-flex items-center rounded-full bg-[var(--color-surface-strong)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]";

type ProfileSummaryProps = {
  profile: ProfileRouteData["profile"];
  restrictions: ProfileRouteData["restrictions"];
  testId?: string;
};

export function ProfileSummary({
  profile,
  restrictions,
  testId = "profile-summary",
}: ProfileSummaryProps) {
  return (
    <section
      className="space-y-3 px-5"
      aria-label="Profile summary"
      data-testid={testId}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1
            className="text-3xl font-bold text-primary-dark"
            data-testid={`${testId}-name`}
          >
            {profile.name}
          </h1>
          {profile.isVerified ? (
            <span
              className={`${badgeBase} text-primary`}
              data-testid={`${testId}-badge-verified`}
            >
              Verified
            </span>
          ) : null}
          {profile.isPrivate ? (
            <span className={badgeBase} data-testid={`${testId}-badge-private`}>
              Private
            </span>
          ) : null}
        </div>
        <p
          className="text-base text-muted-foreground"
          data-testid={`${testId}-username`}
        >
          @{profile.username}
        </p>
      </div>

      {restrictions ? (
        <p
          className="text-sm font-medium text-warning-foreground"
          role="status"
          aria-live="polite"
          data-testid={`${testId}-restriction`}
        >
          {restrictions.message}
        </p>
      ) : null}
    </section>
  );
}
