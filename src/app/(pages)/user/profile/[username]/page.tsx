import { ProfilePage } from "@/features/pages/profile/page";
import { getProfilePageMetadata } from "@/features/pages/profile/page/profilePageMeta";
import { PostDetailsModalLayer } from "@/features/parts/postDetails/components/PostDetailsModal/PostDetailsModalLayer";

export const dynamic = "force-dynamic";

type RouteProps = {
  params: Promise<{ username: string }>;
};

export default async function RouteProfilePage({ params }: RouteProps) {
  const { username } = await params;
  return (
    <>
      <PostDetailsModalLayer />
      <ProfilePage username={username} />
    </>
  );
}

export async function generateMetadata(props: RouteProps) {
  const { username } = await props.params;
  return getProfilePageMetadata(username);
}
