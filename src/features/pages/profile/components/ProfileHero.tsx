import Image from "next/image";

type ProfileHeroProps = {
  coverUrl: string | null;
  avatarUrl: string | null;
  name: string;
  testId?: string;
};

export function ProfileHero({
  coverUrl,
  avatarUrl,
  name,
  testId = "profile-hero",
}: ProfileHeroProps) {
  const initials = (name ?? "?").charAt(0).toUpperCase();
  return (
    <section
      className="space-y-4"
      aria-label="Profile hero"
      data-testid={testId}
    >
      <div className="h-80 w-full rounded-xl" data-testid={`${testId}-cover`}>
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
          <div
            className="text-5xl flex items-center justify-center h-80 w-full rounded-xl text-white bg-secondary/80"
            role="img"
            aria-label={`${name} cover image placeholder`}
          >
            No cover image
          </div>
        )}
      </div>

      <div className="-mt-16 flex items-end gap-4 px-5">
        <div
          className="h-40 w-40 overflow-hidden rounded-full border-4 border-white border-surface bg-white"
          data-testid={`${testId}-avatar`}
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
              className="flex h-full w-full items-center justify-center text-3xl font-semibold text-muted-foreground bg-white"
              aria-label={`${name} avatar placeholder`}
              role="img"
              data-testid={`${testId}-avatar-placeholder`}
            >
              {initials}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
