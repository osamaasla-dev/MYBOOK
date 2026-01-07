import {
  FieldErrors,
  UseFormRegister,
  Control,
  Controller,
} from "react-hook-form";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  loading: boolean;
  control: Control<SignUpInput>;
};

export function GenderBirthFields({
  register,
  errors,
  loading,
  control,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white">
      <div>
        <Label htmlFor="gender" className="mb-1 block">
          Gender
        </Label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger
                id="gender"
                disabled={loading}
                data-testid="gender-select"
                aria-label="Select gender"
                aria-invalid={!!errors.gender}
                aria-describedby="gender-error"
              >
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.gender && (
          <p
            className="text-danger text-xs mt-1"
            id="gender-error"
            role="alert"
            aria-live="assertive"
          >
            {String(errors.gender.message)}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="birthDate" className="mb-1 block">
          Birth date
        </Label>
        <Input
          id="birthDate"
          type="date"
          {...register("birthDate", { valueAsDate: true })}
          disabled={loading}
          data-testid="birth-date-input"
          aria-invalid={!!errors.birthDate}
          aria-describedby="birth-date-error"
        />
        {errors.birthDate && (
          <p
            className="text-danger text-xs mt-1"
            id="birth-date-error"
            role="alert"
            aria-live="assertive"
          >
            {String(errors.birthDate.message)}
          </p>
        )}
      </div>
    </div>
  );
}
