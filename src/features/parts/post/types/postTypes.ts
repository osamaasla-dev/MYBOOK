import type { Prisma } from "@prisma/client";

export type CreatePostResponseData = Prisma.PostGetPayload<{
  include: {
    media: true;
  };
}>;
