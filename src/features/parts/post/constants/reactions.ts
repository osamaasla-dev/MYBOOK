export const POST_REACTION_OPTIONS = [
  { id: "like", label: "Like", emoji: "👍" },
  { id: "love", label: "Love", emoji: "❤️" },
  { id: "funny", label: "Funny", emoji: "😂" },
  { id: "wow", label: "Wow", emoji: "😮" },
  { id: "sad", label: "Sad", emoji: "😢" },
  { id: "angry", label: "Angry", emoji: "😡" },
] as const;

export type PostReactionType = (typeof POST_REACTION_OPTIONS)[number]["id"];

export function isValidPostReactionType(
  value: string
): value is PostReactionType {
  return POST_REACTION_OPTIONS.some((option) => option.id === value);
}

export function reactionTypeToEmoji(type: PostReactionType): string {
  const match = POST_REACTION_OPTIONS.find((option) => option.id === type);
  return match?.emoji ?? "👍";
}
