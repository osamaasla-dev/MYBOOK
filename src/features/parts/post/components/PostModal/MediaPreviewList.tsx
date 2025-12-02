"use client";

import type { MediaPreview } from "./hooks";
import { MediaPreviewItem } from "./MediaPreviewItem";

type MediaPreviewListProps = {
  previews: MediaPreview[];
  onRemove: (id: string) => void;
};

export function MediaPreviewList({
  previews,
  onRemove,
}: MediaPreviewListProps) {
  if (!previews.length) {
    return null;
  }

  return (
    <span className="block">
      {previews.map((media) => (
        <MediaPreviewItem key={media.id} media={media} onRemove={onRemove} />
      ))}
    </span>
  );
}
