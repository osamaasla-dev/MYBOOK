import {
  reactionTypeToEmoji,
  type PostReactionType,
} from "../../../constants/reactions";
import type { ReactionSummary } from "../../../utils/reaction";

export function adjustReactionSummary(
  summary: ReactionSummary | null,
  previous: PostReactionType | null,
  next: PostReactionType | null
): ReactionSummary | null {
  if (!summary && !next) {
    return summary;
  }

  if (previous === next) {
    return summary;
  }

  const working: ReactionSummary = summary ? { ...summary } : {};

  if (previous) {
    const prevEmoji = reactionTypeToEmoji(previous);
    const nextCount = (working[prevEmoji] ?? 0) - 1;
    if (nextCount > 0) {
      working[prevEmoji] = nextCount;
    } else {
      delete working[prevEmoji];
    }
  }

  if (next) {
    const nextEmoji = reactionTypeToEmoji(next);
    working[nextEmoji] = (working[nextEmoji] ?? 0) + 1;
  }

  return Object.keys(working).length ? working : null;
}
