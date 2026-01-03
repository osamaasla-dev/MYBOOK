"use client";

import { useEffect, useState } from "react";

import type { PostCardMedia } from "./types";
import { MediaDisplay } from "./MediaDisplay";
import { MediaNavigation } from "./MediaNavigation";
import { MediaIndicators } from "./MediaIndicators";

type PostCardMediaGridProps = {
  items: PostCardMedia[];
  testId?: string;
};

export function PostCardMediaGrid({ items, testId }: PostCardMediaGridProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!items.length) {
      if (currentIndex !== 0) {
        setCurrentIndex(0);
      }
      return;
    }

    if (currentIndex > items.length - 1) {
      setCurrentIndex(items.length - 1);
    }
  }, [items.length, currentIndex]);

  if (!items.length) return null;

  const currentMedia = items[currentIndex];
  if (!currentMedia) return null;
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

  const handleIndicatorClick = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div className="space-y-4" data-testid={testId}>
      {/* Main media display with navigation */}
      <div className="relative">
        <MediaDisplay
          currentMedia={currentMedia}
          currentIndex={currentIndex}
          totalItems={items.length}
          testId={testId || ""}
        />

        <MediaNavigation
          currentIndex={currentIndex}
          totalItems={items.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goToPrev}
          onNext={goToNext}
          testId={testId || ""}
        />
      </div>

      {/* Dot indicators */}
      <MediaIndicators
        items={items}
        currentIndex={currentIndex}
        onIndicatorClick={handleIndicatorClick}
        testId={testId || ""}
      />
    </div>
  );
}
