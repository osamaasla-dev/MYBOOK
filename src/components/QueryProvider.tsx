"use client";

import {
  HydrationBoundary,
  QueryClient,
  QueryClientProvider,
  type DehydratedState,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function QueryProvider({
  children,
  state,
}: {
  children: React.ReactNode;
  state?: DehydratedState;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={state}>{children}</HydrationBoundary>
    </QueryClientProvider>
  );
}
