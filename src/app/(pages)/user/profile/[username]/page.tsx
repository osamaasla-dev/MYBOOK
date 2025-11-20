type ProfilePageProps = {
  params: { username: string };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  return (
    <section className="space-y-2">
      <p className="text-sm uppercase tracking-wide text-[var(--color-muted-foreground)]">
        الملف الشخصي
      </p>
      <h1 className="text-3xl font-bold text-[var(--color-primary-dark)]">
        {username}
      </h1>
      <p className="text-[var(--color-muted-foreground)]">@{username}</p>
    </section>
  );
}
