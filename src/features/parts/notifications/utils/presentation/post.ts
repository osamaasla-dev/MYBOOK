import type { Builder } from "./types";

type PostNotificationMetadata = {
  kind: "post_created";
  authorName: string | null;
};

export const postPresentationBuilder: Builder = (notification) => {
  const metadata = notification.metadata as PostNotificationMetadata | null;
  const name = metadata?.authorName ?? "SomeOne";

  return {
    title: name,
    subtitle: "shared a new post",
  };
};
