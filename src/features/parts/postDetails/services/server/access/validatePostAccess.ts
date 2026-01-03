import { Visibility } from "@prisma/client";
import { resolveEffectiveVisibility } from "@/features/pages/home/services/posts/post-ranking/privacy";
import { canViewerSeePost } from "@/features/pages/home/services/posts/post-ranking/visibility";
import { fetchPostDetails } from "../post";
import { resolvePostAuthorRelationship } from "../utils";

type ValidatePostAccessInput = {
  postId: string;
  viewerId: string | null;
};

type ValidatePostAccessResult = {
  postRecord: NonNullable<Awaited<ReturnType<typeof fetchPostDetails>>>;
  relationship: Awaited<ReturnType<typeof resolvePostAuthorRelationship>>;
} | null;

export async function validatePostAccess({
  postId,
  viewerId,
}: ValidatePostAccessInput): Promise<ValidatePostAccessResult> {
  const postRecord = await fetchPostDetails({ postId, viewerId });
  if (!postRecord) {
    return null;
  }

  const relationship = await resolvePostAuthorRelationship({
    viewerId,
    authorId: postRecord.authorId,
  });

  const authorDefaultVisibility =
    postRecord.author.privacySetting?.postsVisibility ?? Visibility.PUBLIC;
  const effectiveVisibility = resolveEffectiveVisibility(
    postRecord.visibility,
    postRecord.visibilityPreference,
    authorDefaultVisibility
  );

  if (!canViewerSeePost(effectiveVisibility, relationship)) {
    return null;
  }

  return { postRecord, relationship };
}
