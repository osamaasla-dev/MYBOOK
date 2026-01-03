import { getRelationsPageMetadata } from "@/features/pages/relations/page/relationsMeta";
import { RelationsPage } from "@/features/pages/relations/page/RelationsPage";
import { PostDetailsModalLayer } from "@/features/parts/postDetails/components/PostDetailsModal/PostDetailsModalLayer";

export const dynamic = "force-dynamic";

export default function RelationsRoutePage() {
  return (
    <>
      <PostDetailsModalLayer />
      <RelationsPage />
    </>
  );
}

export const generateMetadata = getRelationsPageMetadata;
