"use client";

import { authMessages } from "@/lib/messages";
import { useSearchParams } from "next/navigation";
import { useMemo, Suspense } from "react";
import { useVerifyEmail } from "../hooks/useVerifyEmail";

function VerifyEmailManagerInner() {
  const search = useSearchParams();
  const token = useMemo(() => search.get("token") || "", [search]);
  const isPending = useMemo(() => search.get("pending") === "1", [search]);
  const { status, message } = useVerifyEmail({ token, isPending });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4">
      <div className="max-w-md w-full bg-white shadow rounded p-6 text-center">
        {status === "verifying" && (
          <>
            <h1 className="text-xl font-semibold mb-2">
              {authMessages.verify.title.verifying}
            </h1>
            <p className="text-muted-foreground">
              {authMessages.verify.info.wait}
            </p>
          </>
        )}
        {status === "pending" && (
          <>
            <h1 className="text-xl font-semibold mb-2">
              {authMessages.verify.title.pending}
            </h1>
            <p className="text-foreground">{message}</p>
          </>
        )}
        {status === "success" && (
          <>
            <h1 className="text-xl font-semibold text-success mb-2">
              {authMessages.verify.title.success}
            </h1>
            <p className="text-foreground">{message}</p>
            <p className="text-muted-foreground mt-2">
              {authMessages.verify.info.redirecting}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-danger mb-2">
              {authMessages.verify.title.error}
            </h1>
            <p className="text-foreground">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailManager() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailManagerInner />
    </Suspense>
  );
}
