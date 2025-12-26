import { z } from "zod";

export const createReplySchema = z.object({
  content: z
    .string()
    .min(1, "Reply cannot be empty")
    .max(2000, "Reply is too long (max 2000 characters)"),
});

export type CreateReplyInput = z.infer<typeof createReplySchema>;
