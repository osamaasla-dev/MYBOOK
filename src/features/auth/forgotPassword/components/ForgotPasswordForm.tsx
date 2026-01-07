"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordValues } from "../schemas";
import type { ForgotPasswordFormProps } from "../types";
import Link from "next/link";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordForm({
  onSubmit,
  loading = false,
  className = "",
}: ForgotPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`max-w-md w-full bg-white rounded shadow p-6 space-y-4 ${className}`}
      data-testid="forgot-password-form"
    >
      <h1 className="text-2xl font-bold" id="forgot-password-heading">
        Forgot Password
      </h1>
      <p className="text-sm text-muted-foreground">
        Enter your email and we will send you a reset link.
      </p>
      <div>
        <Label htmlFor="email" className="mb-1 block">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          autoComplete="email"
          disabled={loading}
          data-testid="email-input"
          aria-invalid={!!errors.email}
          aria-describedby="forgot-email-error"
        />
        {errors.email && (
          <p
            className="text-danger text-xs mt-1"
            id="forgot-email-error"
            role="alert"
          >
            {String(errors.email.message)}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full text-white"
        data-testid="forgot-submit"
        aria-disabled={loading}
        aria-label="Send reset link"
      >
        {loading ? "Sending..." : "Send reset link"}
      </Button>
      <div className="text-center">
        <Link href="/signin" className="text-primary-dark hover:underline">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
