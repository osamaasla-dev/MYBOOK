import { z } from "zod";

import { Visibility, PostVisibilityPreference } from "@prisma/client";

import { postMessages } from "@/lib/messages";

const mediaTypes = ["image", "video"] as const;

const postMediaSchema = z.object({
  id: z.string().cuid().optional(),
  url: z.string().url(),
  publicId: z.union([z.string().min(1), z.null()]).optional(),
  folder: z.string().optional(),
  format: z.string().optional(),
  type: z.enum(mediaTypes).default("image"),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  duration: z.number().nonnegative().nullable().optional(),
  frames: z.number().int().nonnegative().nullable().optional(),
  frameRate: z.string().optional().nullable(),
});

export const createPostSchema = z
  .object({
    content: z.string().trim().optional(),
    visibility: z.nativeEnum(Visibility).default(Visibility.PUBLIC),
    visibilityPreference: z
      .nativeEnum(PostVisibilityPreference)
      .default(PostVisibilityPreference.ACCOUNT_DEFAULT),
    media: z
      .array(postMediaSchema)
      .max(10, postMessages.validation.mediaLimit)
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      const hasContent =
        typeof data.content === "string" && data.content.trim().length > 0;
      const hasMedia = Array.isArray(data.media) && data.media.length > 0;
      return hasContent || hasMedia;
    },
    {
      message: postMessages.validation.contentOrMediaRequired,
      path: ["content"],
    }
  );

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreatePostMediaInput = z.infer<typeof postMediaSchema>;
