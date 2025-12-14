"use client";

import Image from "next/image";

import type { PostCardMedia } from "./types";

type PostCardMediaGridProps = {
  items: PostCardMedia[];
};

export function PostCardMediaGrid({ items }: PostCardMediaGridProps) {
  if (!items.length) return null;

  const images = items.filter((item) => item.type === "IMAGE");
  const videos = items.filter((item) => item.type === "VIDEO");

  return (
    <div className="space-y-4">
      {images.length > 0 && <ImageGrid items={images} />}
      {videos.length > 0 && <VideoGrid items={videos} />}
    </div>
  );
}

function ImageGrid({ items }: { items: PostCardMedia[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Image
          key={item.id}
          src={item.url}
          alt="Post media"
          width={1200}
          height={1200}
          className="w-full h-auto  object-cover"
          sizes="100vw"
          priority={items.length === 1}
        />
      ))}
    </div>
  );
}

function VideoGrid({ items }: { items: PostCardMedia[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <video
          key={item.id}
          controls
          className="w-full rounded-2xl bg-black"
          poster={item.posterUrl ?? undefined}
        >
          <source src={item.url} />
          Your browser does not support the video element.
        </video>
      ))}
    </div>
  );
}
