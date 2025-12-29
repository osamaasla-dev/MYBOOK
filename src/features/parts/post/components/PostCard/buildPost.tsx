// import type { FeedPost } from "@/features/pages/home/utils/posts/feed-response";
// import type { PostCardMedia } from "./types";
// import { PostCardProps } from "./types";

// const MEDIA_TYPES: PostCardMedia["type"][] = [
//   "IMAGE",
//   "VIDEO",
//   "AUDIO",
//   "DOCUMENT",
// ];

// function toPostCardMediaType(
//   type: string | null | undefined
// ): PostCardMedia["type"] {
//   if (type && MEDIA_TYPES.includes(type as PostCardMedia["type"])) {
//     return type as PostCardMedia["type"];
//   }
//   return "IMAGE";
// }

// export function buildPostCardPropsFromFeedPost(post: FeedPost): PostCardProps {
//   return {
//     postId: post.postId,
//     author: {
//       id: post.author.id,
//       name: post.author.name ?? post.author.username ?? "User",
//       username: post.author.username ?? undefined,
//       avatarUrl: post.author.avatarUrl ?? undefined,
//       isFollowing: post.author.isFollowing,
//       isFriend: post.author.isFriend,
//       isSelf: post.author.isSelf,
//     },
//     timestamp: post.publishedAt,
//     content: {
//       text: post.content.text ?? "This post has no text.",
//       media:
//         post.content.media?.map(
//           (item): PostCardMedia => ({
//             id: item.id,
//             url: item.url,
//             type: toPostCardMediaType(item.type),
//           })
//         ) ?? [],
//     },
//     stats: {
//       comments: post.commentsCount,
//       shares: post.sharesCount,
//       viewerReaction: post.interactions.viewerReaction,
//       reactionSummary: post.reactionSummary ?? undefined,
//     },
//     setting:{
//       visibility: post.visibility,
//       visibilityPreference: post.visibilityPreference,
//     }
//   };
// }
