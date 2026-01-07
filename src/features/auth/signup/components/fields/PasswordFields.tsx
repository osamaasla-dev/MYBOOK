import {
  FieldErrors,
  UseFormRegister,
  Control,
  useWatch,
} from "react-hook-form";
import { useMemo } from "react";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  loading: boolean;
  control: unknown;
};

export function PasswordFields({ register, errors, loading, control }: Props) {
  const ctrl = control as Control<SignUpInput>;
  const passwordValue = useWatch({ control: ctrl, name: "password" });
  const strength = useMemo(() => {
    const pwd = passwordValue || "";
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (!pwd) return { label: "", color: "bg-secondary", width: "w-0" };
    if (score <= 2)
      return { label: "Weak", color: "bg-danger", width: "w-1/4" };
    if (score === 3)
      return { label: "Medium", color: "bg-warning", width: "w-2/4" };
    if (score === 4)
      return { label: "Strong", color: "bg-success", width: "w-3/4" };
    return { label: "Very strong", color: "bg-success", width: "w-full" };
  }, [passwordValue]);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="password" className="mb-1 block">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          {...register("password")}
          disabled={loading}
          autoComplete="new-password"
          aria-describedby="password-help"
          data-testid="password-input"
          aria-invalid={!!errors.password}
        />
        <div className="mt-2">
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-2 ${strength.color} ${strength.width} transition-all duration-300`}
            ></div>
          </div>
          {strength.label && (
            <div className="flex items-center justify-between mt-1 text-xs">
              <span className="text-muted-foreground">Strength</span>
              <span className="font-medium">{strength.label}</span>
            </div>
          )}
        </div>
        <p id="password-help" className="text-xs text-muted-foreground mt-1">
          Must be at least 8 characters and include uppercase, lowercase, and a
          symbol.
        </p>
        {errors.password && (
          <p className="text-danger text-xs mt-1">
            {String(errors.password.message)}
          </p>
        )}
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
          aria-describedby="signup-confirm-password-error"
        />
        {errors.confirmPassword && (
          <p
            className="text-danger text-xs mt-1"
            id="signup-confirm-password-error"
            role="alert"
            aria-live="assertive"
          >
            {String(errors.confirmPassword.message)}
          </p>
        )}
      </div>
    </div>
  );
}
