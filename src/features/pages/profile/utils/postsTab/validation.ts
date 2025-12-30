import { z } from "zod";

export const profilePostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type ProfilePostsQuery = z.infer<typeof profilePostsQuerySchema>;
