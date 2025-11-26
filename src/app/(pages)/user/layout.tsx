import type { ReactNode } from "react";

import { Navbar } from "@/features/components/navbar";
import { QueryProvider } from "@/components";

export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </div>
    </QueryProvider>
  );
}
