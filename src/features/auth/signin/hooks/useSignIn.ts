"use client";

import authMessages from "@/lib/messages/auth";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import type { SignInValues } from "../schemas";

export function useSignIn() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/user";

  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(
    async (values: SignInValues) => {
      setLoading(true);

      const res = await signIn("credentials", {
        ...values,
        redirect: false,
      });

      if (res?.ok) {
        toast.success(authMessages.signin.success);
        router.push(callbackUrl);
      } else {
        if (res?.error === "EMAIL_NOT_VERIFIED") {
          toast.error(authMessages.signin.emailNotVerified);
          router.push("/verify-email?pending=1");
        } else if (res?.error === "OAUTH_ONLY") {
          setLoading(false);
        } else if (res?.error && res.error.startsWith("ACCOUNT_LOCKED:")) {
          const minutes = Number(res.error.split(":")[1] || "15");
          const msg = authMessages.lockout?.locked
            ? authMessages.lockout.locked(minutes)
            : `Your account is temporarily locked. Please try again in ${minutes} minutes.`;
          toast.error(msg);
          setLoading(false);
        } else {
          toast.error(authMessages.signin.invalidCredentials);
          setLoading(false);
        }
      }
    },
    [router, callbackUrl]
  );

  return { loading, setLoading, handleSignIn };
}
