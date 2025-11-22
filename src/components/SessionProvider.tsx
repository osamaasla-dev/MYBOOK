"use client";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import React from "react";

export function NextAuthSessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session;
}) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
