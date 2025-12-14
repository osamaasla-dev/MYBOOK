import {
  PostReactionType,
  reactionTypeToEmoji,
} from "../../../constants/reactions";
import type { PostReactionListItem } from "./types";
import type { PostReactionRecord } from "./queries";

export function mapReactionRecordToItem(
  record: PostReactionRecord
): PostReactionListItem {
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
