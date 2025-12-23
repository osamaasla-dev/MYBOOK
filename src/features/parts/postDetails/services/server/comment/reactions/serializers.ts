import {
  PostReactionType,
  reactionTypeToEmoji,
} from "@/features/parts/post/constants/reactions";
import type { CommentReactionRecord } from "./queries";
import type { CommentReactionListItem } from "./types";

export function mapCommentReactionRecordToItem(
  record: CommentReactionRecord
): CommentReactionListItem {
  const reactionType = record.emoji as PostReactionType;

  return {
    id: record.id,
    reaction: reactionType,
    emoji: reactionTypeToEmoji(reactionType),
    createdAt: record.createdAt.toISOString(),
    user: {
      id: record.user.id,
      username: record.user.username,
      name: record.user.name,
      avatarUrl: record.user.avatarUrl,
    },
  };
}
