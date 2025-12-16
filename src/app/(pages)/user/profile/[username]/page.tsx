import { ProfilePage } from "@/features/pages/profile/page";
import { PostDetailsModalLayer } from "@/features/parts/post/components/PostDetailsModal/PostDetailsModalLayer";

type RouteProps = {
  params: { username: string };
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
