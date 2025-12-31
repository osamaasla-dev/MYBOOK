"use client";

import Image from "next/image";
import { useState } from "react";

import type { PostCardMedia } from "./types";

type PostCardMediaGridProps = {
  items: PostCardMedia[];
};

export function PostCardMediaGrid({ items }: PostCardMediaGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items.length) return null;

  const currentMedia = items[currentIndex];
  const hasNext = currentIndex < items.length - 1;
  const hasPrev = currentIndex > 0;

  const goToNext = () => {
    if (hasNext) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (hasPrev) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4">
      {/* Main media display */}
      <div className="relative overflow-hidden bg-black group">
        {currentMedia.type === "IMAGE" ? (
          <Image
            src={currentMedia.url}
            alt="Post media"
            width={1200}
            height={1200}
            className="w-full h-auto object-contain max-h-[600px]"
            sizes="100vw"
            priority
          />
        ) : (
          <video
            controls
            className="w-full h-auto max-h-[600px]"
            poster={currentMedia.posterUrl ?? undefined}
          >
            <source src={currentMedia.url} />
            Your browser does not support video element.
          </video>
        )}

        {/* Navigation arrows */}
        {hasPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {hasNext && (
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}

        {/* Media counter */}
        {items.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm transition-all duration-200 opacity-0 group-hover:opacity-100">
            {currentIndex + 1} / {items.length}
          </div>
        )}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => handleThumbnailClick(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
                index === currentIndex
                  ? "bg-blue-500 w-6"
                  : "bg-gray-300 hover:bg-gray-400"
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
