import Image from "next/image";

type ProfileHeroProps = {
  coverUrl: string | null;
  avatarUrl: string | null;
  name: string;
};

export function ProfileHero({ coverUrl, avatarUrl, name }: ProfileHeroProps) {
  const initials = (name ?? "?").charAt(0).toUpperCase();

  return (
    <section
      className="space-y-4"
      aria-label="Profile hero"
      data-testid="profile-hero"
    >
      <div
        className="h-40 w-full rounded-xl bg-gradient-to-r from-primary-dark to-primary"
        data-testid="profile-cover"
      >
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${name} cover image`}
            width={1200}
            height={320}
            className="h-full w-full rounded-xl object-cover"
            priority
          />
        ) : (
          <span className="sr-only">لا توجد صورة غلاف</span>
        )}
      </div>

      <div className="-mt-16 flex items-end gap-4">
        <div
          className="h-32 w-32 overflow-hidden rounded-full border-4 border-surface bg-background"
          data-testid="profile-avatar"
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={`${name} avatar`}
              width={128}
              height={128}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground"
              aria-label={`${name} avatar placeholder`}
              role="img"
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
