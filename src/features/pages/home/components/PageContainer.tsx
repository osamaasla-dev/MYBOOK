import { forwardRef, ReactNode } from "react";

export const PageContainer = forwardRef<
  HTMLDivElement,
  { children: ReactNode; testId?: string }
>(function PageContainerBase({ children, testId = "page-container" }, ref) {
  return (
    <div
      ref={ref}
      className="grid grid-cols-7"
      data-testid={testId}
      role="main"
      aria-label="Main content"
    >
      {children}
    </div>
  );
});
