import { useMemo } from "react";

import { CollapsibleText } from "./CollapsibleText";
import { PostCardMediaGrid } from "./PostCardMediaGrid";

import type { PostCardContent } from "./types";

type Props = {
  content: PostCardContent;
  testId?: string;
};

export function PostCardBody({ content, testId }: Props) {
  const media = useMemo(() => content.media ?? [], [content.media]);
  const hasImages = useMemo(
    () => media.some((item) => item.type === "IMAGE"),
    [media]
  );
  const collapsedLines = hasImages ? 5 : 15;

  return (
    <section
      className="mt-4 space-y-4 text-base leading-tight"
      data-testid={testId}
      aria-label="Post content"
    >
      {content.text && (
        <CollapsibleText
          text={content.text}
          collapsedLines={collapsedLines}
          testId={`${testId}-text`}
        />
      )}

      <PostCardMediaGrid items={media} testId={`${testId}-media`} />
    </section>
  );
}
