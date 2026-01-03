"use client";
import { LoadingSpinner } from "@/components";
import { QueryProvider } from "@/components";
import { authMessages } from "@/lib/messages";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, Suspense } from "react";
import ResetPasswordForm from "../components/ResetPasswordForm";
import { useResetPassword } from "../hooks/useResetPassword";
import type { ResetPasswordValues } from "../schemas";
import { validateResetToken } from "../services";
import { Button } from "@/components/ui";

function ResetPasswordManagerInner() {
  return (
    <QueryProvider>
      <ResetPasswordInner />
    </QueryProvider>
  );
}

function ResetPasswordInner() {
  const search = useSearchParams();
  const token = useMemo(() => search.get("token") || "", [search]);
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!token) {
        setChecking(false);
        setValid(false);
        return;
      }
      try {
        const { valid } = await validateResetToken(token);
        if (!active) return;
        setValid(Boolean(valid));
      } catch {
        if (!active) return;
        // keep silent, UI will show invalid state
        setValid(false);
      } finally {
        if (active) setChecking(false);
      }
    };
    run();
    return () => {
      active = false;
    };
  }, [token]);

  const { mutateAsync, isPending } = useResetPassword();

  const handleSubmit = async (values: ResetPasswordValues) => {
    await mutateAsync({ token, ...values });
    router.push("/signin");
  };

  if (checking) return <LoadingSpinner text="Checking link..." />;

  if (!valid) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4"
        data-testid="reset-password-invalid"
      >
        <div className="max-w-md w-full bg-white rounded shadow p-6 text-center">
          <h1
            className="text-xl font-semibold mb-2"
            role="alert"
            aria-live="assertive"
          >
            {authMessages.password.invalidToken}
          </h1>
          <Button asChild className="mt-4">
            <Link href="/forgot-password">Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4 relative"
      data-testid="reset-password-page"
      aria-busy={isPending}
    >
      {isPending && <LoadingSpinner text="Resetting password..." />}
      <div
        className={`w-full max-w-md transition-opacity duration-200 ${
          isPending ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <ResetPasswordForm onSubmit={handleSubmit} loading={isPending} />
      </div>
    </div>
  );
}

export function ResetPasswordManager() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordManagerInner />
    </Suspense>
  );
}
