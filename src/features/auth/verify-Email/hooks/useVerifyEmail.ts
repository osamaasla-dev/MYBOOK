"use client";

import { normalizeError } from "@/lib/http/normalizeError";
import { authMessages } from "@/lib/messages";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { verifyEmail } from "../services";

export type VerifyStatus = "idle" | "verifying" | "success" | "error" | "pending";

export function useVerifyEmail({
  token,
  isPending,
  redirectOnSuccess = true,
  redirectDelayMs = 1500,
}: {
  token: string;
  isPending: boolean;
  redirectOnSuccess?: boolean;
  redirectDelayMs?: number;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<VerifyStatus>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (isPending) {
        setStatus("pending");
        setMessage(authMessages.verify.info.checkInbox);
        return;
      }
      if (!token) {
        setStatus("error");
        setMessage(authMessages.verify.result.missingToken);
        return;
      }
      try {
        setStatus("verifying");
        await verifyEmail(token);
        if (!active) return;
        setStatus("success");
        setMessage(authMessages.verify.result.success);
        if (redirectOnSuccess) {
          setTimeout(() => {
            if (!active) return;
            router.push("/signin");
          }, redirectDelayMs);
        }
      } catch (err: unknown) {
        if (!active) return;
        setStatus("error");
        const error = normalizeError(err);
        setMessage(error.message ?? authMessages.verify.result.failed);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [token, isPending, redirectOnSuccess, redirectDelayMs, router]);

  return { status, message } as const;
}
