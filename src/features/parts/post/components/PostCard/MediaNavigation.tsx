"use client";

type MediaNavigationProps = {
  currentIndex: number;
  totalItems: number;
  hasPrev: boolean;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  testId: string;
};

export function MediaNavigation({
  currentIndex,
  totalItems,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  testId,
}: MediaNavigationProps) {
  const NavigationButton = ({
    onClick,
    label,
    testIdSuffix,
    children,
  }: {
    onClick: () => void;
    label: string;
    testIdSuffix: string;
    children: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all duration-200 z-10 cursor-pointer opacity-0 group-hover:opacity-100"
      data-testid={`${testId}-${testIdSuffix}`}
      aria-label={label}
    >
      {children}
    </button>
  );

  return (
    <>
      {hasPrev && (
        <NavigationButton
          onClick={onPrev}
          label="Previous media"
          testIdSuffix="prev"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </NavigationButton>
      )}

      {hasNext && (
        <NavigationButton
          onClick={onNext}
          label="Next media"
          testIdSuffix="next"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </NavigationButton>
      )}

      {totalItems > 1 && (
        <div
          className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
          data-testid={`${testId}-counter`}
          aria-label={`Media ${currentIndex + 1} of ${totalItems}`}
        >
          {currentIndex + 1} / {totalItems}
        </div>
      )}
    </>
  );
}
