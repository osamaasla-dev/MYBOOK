"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInSchema, SignInValues } from "../schemas";
import type { SignInFormProps } from "../types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignInForm({
  onSubmit,
  loading = false,
}: SignInFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md mx-auto p-6 bg-white rounded shadow"
      data-testid="signin-form"
    >
      <div>
        <Label htmlFor="email" className="mb-1 block">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          disabled={loading}
          autoComplete="email"
          data-testid="email-input"
          aria-invalid={!!errors.email}
          aria-describedby="email-error"
        />
        {errors.email && (
          <p className="text-danger text-xs mt-1" id="email-error" role="alert">
            {String(errors.email.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="password" className="mb-1 block">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          disabled={loading}
          autoComplete="current-password"
          data-testid="password-input"
          aria-invalid={!!errors.password}
          aria-describedby="password-error"
        />
        {errors.password && (
          <p
            className="text-danger text-xs mt-1"
            id="password-error"
            role="alert"
          >
            {String(errors.password.message)}
          </p>
        )}
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="w-full text-white"
        data-testid="signin-button"
        aria-disabled={loading}
        aria-label="Submit sign in form"
      >
        {loading ? "Loading..." : "Sign In"}
      </Button>
    </form>
  );
}
