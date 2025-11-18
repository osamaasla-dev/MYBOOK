"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordValues } from "../schemas";
import type { ResetPasswordFormProps } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordForm({
  onSubmit,
  loading = false,
  className = "",
}: ResetPasswordFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`max-w-md w-full bg-white rounded shadow p-6 space-y-4 ${className}`}
      data-testid="reset-password-form"
    >
      <h1 className="text-2xl font-bold">Reset Password</h1>
      <div>
        <Label htmlFor="password" className="mb-1 block">
          New Password
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          disabled={loading}
          autoComplete="new-password"
          data-testid="password-input"
          aria-invalid={!!errors.password}
          aria-describedby="password-help password-error"
        />
        {errors.password && (
          <p className="text-danger text-xs mt-1" id="password-error" role="alert">
            {String(errors.password.message)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1" id="password-help">
          Must be at least 8 characters and include uppercase, lowercase, and a
          symbol.
        </p>
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="mb-1 block">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword")}
          disabled={loading}
          autoComplete="new-password"
          data-testid="confirm-password-input"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby="confirm-password-error"
        />
        {errors.confirmPassword && (
          <p className="text-danger text-xs mt-1" id="confirm-password-error" role="alert">
            {String(errors.confirmPassword.message)}
          </p>
        )}
      </div>
      <Button type="submit" disabled={loading} className="w-full text-white" data-testid="reset-submit" aria-disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}
