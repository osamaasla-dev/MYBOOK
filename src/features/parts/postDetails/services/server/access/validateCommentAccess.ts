import { fetchPostComments, type FetchPostCommentsInput } from "../comment";
import { validatePostAccess } from "./validatePostAccess";

export type ValidateCommentAccessInput = Omit<
  FetchPostCommentsInput,
  "viewerId"
> & {
  viewerId: string | null;
};

export async function validateCommentAccess({
  postId,
  parentId,
  cursor,
  limit,
  viewerId,
}: ValidateCommentAccessInput) {
  // Validate post access before fetching comments
  const accessResult = await validatePostAccess({ postId, viewerId });
  if (!accessResult) {
    return {
      comments: [],
      nextCursor: null,
      accessDenied: true,
    };
  }

  // Fetch comments if access is granted
  const commentsResult = await fetchPostComments({
    postId,
    parentId,
    cursor,
    limit,
    viewerId,
  });

  return {
    ...commentsResult,
    accessDenied: false,
  };
}
