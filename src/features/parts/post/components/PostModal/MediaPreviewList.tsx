"use client";

import type { MediaPreview } from "./hooks";
import { MediaPreviewItem } from "./MediaPreviewItem";

type MediaPreviewListProps = {
  previews: MediaPreview[];
  onRemove: (id: string) => void;
  testId?: string;
};

export function MediaPreviewList({
  previews,
  onRemove,
  testId,
}: MediaPreviewListProps) {
  if (!previews.length) {
    return null;
  }

  return (
    <span
      className="block"
      role="list"
      aria-label={`Media previews (${previews.length} items)`}
      data-testid={testId || "media-preview-list"}
    >
      {previews.map((media, index) => (
        <MediaPreviewItem
          key={media.id}
          media={media}
          onRemove={onRemove}
          testId={testId ? `${testId}-${index}` : `media-preview-${index}`}
        />
      ))}
    </span>
  );
}
