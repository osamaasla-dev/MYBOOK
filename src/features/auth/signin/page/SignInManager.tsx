"use client";
import { LoadingSpinner } from "@/components";
import SignInForm from "@/features/Auth/SignIn/components/SignInForm";
import Link from "next/link";
import { useSignIn } from "../hooks/useSignIn";

export default function SignInManager({ siteName }: { siteName: string }) {
  const { loading, handleSignIn } = useSignIn();

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--color-primary-light)] to-[var(--color-primary)] px-4 relative"
      data-testid="signin-page"
      aria-busy={loading}
    >
      {loading && <LoadingSpinner text="Signing you in..." />}
      <div
        className={`w-full max-w-md bg-white rounded-lg shadow-lg p-8 transition-opacity duration-200 ${
          loading ? "opacity-50 pointer-events-none select-none" : ""
        }`}
      >
        <div className="text-3xl font-extrabold mb-2 text-primary-dark text-center">
          {siteName}
        </div>
        <h1 className="text-3xl font-bold mb-6 text-primary-dark text-center">
          Sign In
        </h1>
        <SignInForm onSubmit={handleSignIn} loading={loading} />
        <div className="mt-3 text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-primary-dark hover:underline"
            data-testid="forgot-link"
          >
            Forgot password?
          </Link>
        </div>
        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary-dark hover:underline font-bold"
              data-testid="signup-link"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
