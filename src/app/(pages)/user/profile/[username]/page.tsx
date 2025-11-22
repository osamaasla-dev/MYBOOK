import { ProfilePage } from "@/features/pages/profile/page";

type RouteProps = {
  params: { username: string };
};

export default async function RouteProfilePage({ params }: RouteProps) {
  const { username } = await params;
  return <ProfilePage username={username} />;
}
