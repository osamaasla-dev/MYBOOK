import { useMemo } from "react";

import { CollapsibleText } from "./CollapsibleText";
import { PostCardMediaGrid } from "./PostCardMediaGrid";

import type { PostCardContent } from "./types";

type Props = {
  content: PostCardContent;
};

export function PostCardBody({ content }: Props) {
  const media = useMemo(() => content.media ?? [], [content.media]);
  const hasImages = useMemo(
    () => media.some((item) => item.type === "IMAGE"),
    [media]
  );
  const collapsedLines = hasImages ? 5 : 15;

  return (
    <section className="mt-4 space-y-4 text-base leading-tight">
      {content.text && (
        <CollapsibleText text={content.text} collapsedLines={collapsedLines} />
      )}

      <PostCardMediaGrid items={media} />
    </section>
  );
}
