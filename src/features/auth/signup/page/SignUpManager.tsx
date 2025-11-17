"use client";
import LoadingSpinner from "@/components/LoadingSpinner";
import QueryProvider from "@/components/QueryProvider";
import SignUpForm from "@/features/auth/signup/components/SignUpForm";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "../hooks/useSignUp";

export default function SignUpManager({ siteName }: { siteName: string }) {
  // Wrap an inner client component with QueryProvider so hooks using React Query have context.
  return (
    <QueryProvider>
      <SignUpManagerInner siteName={siteName} />
    </QueryProvider>
  );
}

function SignUpManagerInner({ siteName }: { siteName: string }) {
  const router = useRouter();
  const { mutateAsync, isPending } = useSignUp();
  const handleSignUp = async (values: SignUpInput): Promise<void> => {
    await mutateAsync(values);
    router.push("/verify-email?pending=1");
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4 relative"
      data-testid="signup-page"
      aria-busy={isPending}
    >
      {isPending && <LoadingSpinner text="Creating your account..." />}
      <div
        className={`w-full max-w-md bg-white rounded-lg shadow-lg p-8 flex flex-col items-center transition-opacity duration-200 ${
          isPending ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <div className="text-3xl font-extrabold mb-2 text-primary-dark">
          {siteName}
        </div>
        <h1 className="text-2xl font-bold mb-6 text-primary-dark">
          Create your account
        </h1>
        <SignUpForm onSubmit={handleSignUp} loading={isPending} />
        <div className="mt-6 text-center w-full">
          <span className="text-muted-foreground text-sm">
            Already have an account?
          </span>
          <Link
            href="/signin"
            className="ml-2 text-primary-dark hover:underline font-bold"
            data-testid="signin-link"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
