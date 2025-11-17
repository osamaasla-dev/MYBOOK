"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import QueryProvider from "@/components/QueryProvider";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import { useForgotPassword } from "../hooks/useForgotPassword";
import type { ForgotPasswordValues } from "../schemas";

export default function ForgotPasswordManager() {
  return (
    <QueryProvider>
      <ForgotPasswordInner />
    </QueryProvider>
  );
}

function ForgotPasswordInner() {
  const { mutateAsync, isPending } = useForgotPassword();

  const onSubmit = async (values: ForgotPasswordValues) => {
    await mutateAsync(values);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4 relative">
      {isPending && <LoadingSpinner text="Sending reset link..." />}
      <div
        className={`w-full max-w-md transition-opacity duration-200 ${
          isPending ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <ForgotPasswordForm onSubmit={onSubmit} loading={isPending} />
      </div>
    </div>
  );
}
