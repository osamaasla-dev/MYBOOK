import { forwardRef, ReactNode } from "react";

export const PageContainer = forwardRef<
  HTMLDivElement,
  { children: ReactNode }
>(function PageContainerBase({ children }, ref) {
  return (
    <div ref={ref} className="">
      {children}
    </div>
  );
});
