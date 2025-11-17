"use client";

import React, { Suspense } from "react";

type Props = {
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export default function ClientSuspense({ fallback, children }: Props) {
  return <Suspense fallback={fallback ?? <div className="p-6">Loading…</div>}>{children}</Suspense>;
}
