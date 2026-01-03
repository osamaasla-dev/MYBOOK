"use client";

type MediaIndicatorsProps = {
  items: unknown[];
  currentIndex: number;
  onIndicatorClick: (index: number) => void;
  testId: string;
};

export function MediaIndicators({
  items,
  currentIndex,
  onIndicatorClick,
  testId,
}: MediaIndicatorsProps) {
  if (items.length <= 1) return null;

  return (
    <div
      className="flex justify-center gap-2 pt-2"
      data-testid={`${testId}-indicators`}
      role="tablist"
      aria-label="Media navigation"
    >
      {items.map((_, index) => (
        <button
          key={index}
          onClick={() => onIndicatorClick(index)}
          className={`w-2 h-2 rounded-full transition-all duration-200 cursor-pointer ${
            index === currentIndex
              ? "bg-blue-500 w-6"
              : "bg-gray-300 hover:bg-gray-400"
          }`}
          aria-label={`Go to image ${index + 1}`}
          data-testid={`${testId}-indicator-${index}`}
          role="tab"
          aria-selected={index === currentIndex}
          aria-controls={`${testId}-main-display`}
        />
      ))}
    </div>
  );
}
