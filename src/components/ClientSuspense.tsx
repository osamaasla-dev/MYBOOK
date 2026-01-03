"use client";

import React, { Suspense } from "react";

type Props = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
  testId?: string;
};

export default function ClientSuspense({
  fallback,
  children,
  testId = "client-suspense",
}: Props) {
  return (
    <div data-testid={testId}>
      <Suspense fallback={fallback ?? <div className="p-6">Loading…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
