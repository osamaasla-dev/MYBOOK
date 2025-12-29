import { z } from "zod";

const MAX_BIO_LENGTH = 500;

export const updateProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(MAX_BIO_LENGTH, `Bio must be less than ${MAX_BIO_LENGTH} characters`)
    .optional(),
  avatarUrl: z
    .union([z.string().url("Invalid avatar URL"), z.null()])
    .optional(),
  coverUrl: z.union([z.string().url("Invalid cover URL"), z.null()]).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
