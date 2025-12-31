import { z } from "zod";

import {
  USER_SEARCH_RESULTS_DEFAULT_LIMIT,
  USER_SEARCH_RESULTS_MAX_LIMIT,
} from "@/features/parts/search/constants";

export const searchUsersQuerySchema = z.object({
  query: z.string().trim().min(1, { message: "query parameter is required" }),
  limit: z
    .number()
    .int()
    .min(1)
    .max(USER_SEARCH_RESULTS_MAX_LIMIT)
    .default(USER_SEARCH_RESULTS_DEFAULT_LIMIT),
  cursor: z.string().cuid().optional(),
});

export type ParsedSearchUsersParams = z.infer<typeof searchUsersQuerySchema>;
