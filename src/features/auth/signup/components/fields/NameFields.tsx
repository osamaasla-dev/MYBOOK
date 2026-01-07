import { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  loading: boolean;
};

export function NameFields({ register, errors, loading }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="firstName" className="mb-1 block">
          First name
        </Label>
        <Input
          id="firstName"
          type="text"
          {...register("firstName")}
          disabled={loading}
          autoComplete="given-name"
          data-testid="first-name-input"
          aria-invalid={!!errors.firstName}
          aria-describedby="first-name-error"
        />
        {errors.firstName && (
          <p
            className="text-danger text-xs mt-1"
            id="first-name-error"
            role="alert"
            aria-live="assertive"
          >
            {String(errors.firstName.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="lastName" className="mb-1 block">
          Last name
        </Label>
        <Input
          id="lastName"
          type="text"
          {...register("lastName")}
          disabled={loading}
          autoComplete="family-name"
          data-testid="last-name-input"
          aria-invalid={!!errors.lastName}
          aria-describedby="last-name-error"
        />
        {errors.lastName && (
          <p
            className="text-danger text-xs mt-1"
            id="last-name-error"
            role="alert"
            aria-live="assertive"
          >
            {String(errors.lastName.message)}
          </p>
        )}
      </div>
    </div>
  );
}
