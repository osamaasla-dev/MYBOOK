import { z } from "zod";

import { POST_REACTION_OPTIONS } from "@/features/parts/post/constants/reactions";

export const DEFAULT_POST_REACTIONS_LIMIT = 10;
export const MAX_POST_REACTIONS_LIMIT = 10;
const clampLimit = (value: number) =>
  Math.min(Math.max(value, 1), MAX_POST_REACTIONS_LIMIT);
const reactionTabs = [
  "all",
  ...POST_REACTION_OPTIONS.map((option) => option.id),
] as const;
export type ReactionTab = (typeof reactionTabs)[number];

const tabSchema = z
  .string()
  .optional()
  .refine(
    (value): value is ReactionTab =>
      !value || reactionTabs.includes(value as ReactionTab),
    {
      message: `tab must be one of: ${reactionTabs.join(", ")}`,
    }
  )
  .transform((value) => (value ?? "all") as ReactionTab);

export const postReactionsQuerySchema = z.object({
  postId: z.string().cuid(),
  tab: tabSchema,
  limit: z.preprocess((value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
      return clampLimit(value);
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return clampLimit(parsed);
      }
    }

    return DEFAULT_POST_REACTIONS_LIMIT;
  }, z.number().int().min(1).max(MAX_POST_REACTIONS_LIMIT)),
  cursor: z.string().optional(),
});

export type PostReactionsQuery = z.infer<typeof postReactionsQuerySchema>;
