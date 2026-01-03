"use client";

import type { MediaPreview } from "./hooks";

type MediaPreviewItemProps = {
  media: MediaPreview;
  onRemove: (id: string) => void;
  testId?: string;
};

export function MediaPreviewItem({
  media,
  onRemove,
  testId,
}: MediaPreviewItemProps) {
  return (
    <div
      className="group relative mb-3 overflow-hidden  bg-muted/30 last:mb-0"
      role="figure"
      aria-label={`Media preview: ${media.name}`}
      data-testid={testId ? `${testId}-item` : "media-preview-item"}
    >
      <button
        type="button"
        onClick={() => onRemove(media.id)}
        className="cursor-pointer absolute right-2 top-2 z-10 rounded-full bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
        aria-label={`Remove ${media.type}: ${media.name}`}
        data-testid={testId ? `${testId}-remove` : "media-preview-remove"}
      >
        Remove
      </button>
      {media.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.name}
          className="w-full object-contain"
          data-testid={testId ? `${testId}-image` : "media-preview-image"}
        />
      ) : (
        <video
          src={media.url}
          className="w-full"
          controls
          aria-label={`Video preview: ${media.name}`}
          data-testid={testId ? `${testId}-video` : "media-preview-video"}
        />
      )}
    </div>
  );
}
