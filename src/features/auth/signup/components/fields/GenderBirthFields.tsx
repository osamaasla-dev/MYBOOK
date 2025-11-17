import { FieldErrors, UseFormRegister, Control, Controller } from "react-hook-form";
import type { SignUpInput } from "@/features/auth/signup/schemas";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type Props = {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  loading: boolean;
  control: Control<SignUpInput>;
};

export function GenderBirthFields({ register, errors, loading, control }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="gender" className="mb-1 block">
          Gender
        </Label>
        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger id="gender" disabled={loading}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {errors.gender && (
          <p className="text-danger text-xs mt-1">{String(errors.gender.message)}</p>
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
        />
        {errors.birthDate && (
          <p className="text-danger text-xs mt-1">{String(errors.birthDate.message)}</p>
        )}
      </div>
    </div>
  );
}
