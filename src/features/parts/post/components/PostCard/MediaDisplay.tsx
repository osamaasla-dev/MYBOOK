"use client";

import Image from "next/image";
import type { PostCardMedia } from "./types";

type MediaDisplayProps = {
  currentMedia: PostCardMedia;
  currentIndex: number;
  totalItems: number;
  testId: string;
};

export function MediaDisplay({
  currentMedia,
  currentIndex,
  totalItems,
  testId,
}: MediaDisplayProps) {
  return (
    <div
      className="relative overflow-hidden bg-black group"
      data-testid={`${testId}-main-display`}
      role="img"
      aria-label={`Media ${currentIndex + 1} of ${totalItems}`}
    >
      {currentMedia.type === "IMAGE" ? (
        <Image
          src={currentMedia.url}
          alt="Post media"
          width={1200}
          height={1200}
          className="w-full h-auto object-contain max-h-[600px]"
          sizes="100vw"
          priority
          data-testid={`${testId}-image`}
        />
      ) : (
        <video
          controls
          className="w-full h-auto max-h-[600px]"
          poster={currentMedia.posterUrl ?? undefined}
          data-testid={`${testId}-video`}
          aria-label={`Video: ${currentMedia.type}`}
        >
          <source src={currentMedia.url} />
          Your browser does not support video element.
        </video>
      )}
    </div>
  );
}
