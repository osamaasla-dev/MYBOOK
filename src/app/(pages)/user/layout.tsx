import type { ReactNode } from "react";

import { Navbar } from "@/features/components/navbar";
import { QueryProvider } from "@/components";
import { PostRealtimeProvider } from "./PostRealtimeProvider";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <PostRealtimeProvider>
        <div className="min-h-screen bg-secondary">
          <Navbar />
          <main className="mx-auto w-full px-4 py-3 lg:px-8">{children}</main>
        </div>
      </PostRealtimeProvider>
    </QueryProvider>
  );
}
