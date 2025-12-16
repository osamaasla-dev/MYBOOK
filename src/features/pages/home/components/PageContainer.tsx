import { forwardRef, ReactNode } from "react";

export const PageContainer = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function PageContainerBase({ children }, ref) {
  return (
    <div ref={ref} className="grid grid-cols-5 gap-6">
      {children}
    </div>
  );
});
