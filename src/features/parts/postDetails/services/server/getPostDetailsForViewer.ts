import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
import type { PostReactionType } from "@/features/parts/post/constants/reactions";
import {
  buildFeedPost,
  type FeedPostRecord,
} from "@/features/parts/post/utils";
import { postDetailsLogger } from "../../utils/logger";
import { fetchPostDetails } from "./fetchPostDetails";
import { fetchViewerPostReaction } from "./fetchViewerPostReaction";
import { resolvePostAuthorRelationship } from "./resolvePostAuthorRelationship";

type GetPostDetailsForViewerInput = {
  postId: string;
  viewerId: string | null;
};

type PostDetailsResult = {
  post: FeedPost;
  viewerReaction: PostReactionType | null;
} | null;

export async function getPostDetailsForViewer({
  postId,
  viewerId,
}: GetPostDetailsForViewerInput): Promise<PostDetailsResult> {
  const log = postDetailsLogger.child({
    func: "getPostDetailsForViewer",
    postId,
    viewerId,
  });

  const postRecord = await fetchPostDetails({ postId });
  if (!postRecord) {
    return null;
  }

  const [relationship, viewerReaction] = await Promise.all([
    resolvePostAuthorRelationship({
      viewerId,
      authorId: postRecord.authorId,
    }),
    fetchViewerPostReaction({ postId, viewerId }),
  ]);

  const feedPost = buildFeedPost({
    post: postRecord as FeedPostRecord,
    relationship,
    viewerReaction,
  });

  log.debug("Built post details payload");

  return { post: feedPost, viewerReaction };
}
