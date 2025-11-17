import { FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  loading: boolean;
};

export function ContactFields({ register, errors, loading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4">
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
        />
        {errors.email && (
          <p className="text-danger text-xs mt-1">
            {String(errors.email.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="phone" className="mb-1 block">
          Phone
        </Label>
        <Input
          id="phone"
          type="tel"
          {...register("phone")}
          disabled={loading}
          autoComplete="tel"
          placeholder="+201234567890"
        />
        {errors.phone && (
          <p className="text-danger text-xs mt-1">
            {String(errors.phone.message)}
          </p>
        )}
      </div>
    </div>
  );
}
