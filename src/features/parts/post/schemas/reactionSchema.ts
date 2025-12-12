import { z } from "zod";

import {
  POST_REACTION_OPTIONS,
  isValidPostReactionType,
  type PostReactionType,
} from "../constants/reactions";

export const postReactionSchema = z.object({
  reaction: z.string().refine(isValidPostReactionType, {
    message: `Reaction must be one of: ${POST_REACTION_OPTIONS.map(
      (r) => r.id
    ).join(", ")}`,
  }) as z.ZodType<PostReactionType>,
});

export type PostReactionPayload = z.infer<typeof postReactionSchema>;
