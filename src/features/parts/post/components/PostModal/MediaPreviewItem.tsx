"use client";

import type { MediaPreview } from "./hooks";

type MediaPreviewItemProps = {
  media: MediaPreview;
  onRemove: (id: string) => void;
};

export function MediaPreviewItem({ media, onRemove }: MediaPreviewItemProps) {
  return (
    <div className="group relative mb-3 overflow-hidden  bg-muted/30 last:mb-0">
      <button
        type="button"
        onClick={() => onRemove(media.id)}
        className="cursor-pointer absolute right-2 top-2 z-10 rounded-full bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100"
      >
        Remove
      </button>
      {media.type === "image" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={media.url}
          alt={media.name}
          className="w-full object-contain"
        />
      ) : (
        <video src={media.url} className="w-full" controls />
      )}
    </div>
  );
}
