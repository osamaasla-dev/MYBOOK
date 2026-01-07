"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signUpSchema, SignUpInput } from "@/features/auth/signup/schemas";
import type { SignUpFormProps } from "../types";
import { Button } from "@/components/ui/button";
import {
  NameFields,
  ContactFields,
  GenderBirthFields,
  PasswordFields,
} from "./fields";

export default function SignUpForm({
  onSubmit,
  loading = false,
}: SignUpFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      gender: "MALE",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 w-full max-w-md mx-auto p-6 bg-white rounded shadow"
      data-testid="signup-form"
      aria-labelledby="signup-form-heading"
    >
      <h2 id="signup-form-heading" className="sr-only">
        Signup form
      </h2>
      <NameFields register={register} errors={errors} loading={loading} />
      <ContactFields register={register} errors={errors} loading={loading} />
      <GenderBirthFields
        register={register}
        errors={errors}
        loading={loading}
        control={control}
      />
      <PasswordFields
        register={register}
        errors={errors}
        loading={loading}
        control={control}
      />
      <Button
        type="submit"
        disabled={loading}
        className="w-full text-primary-light"
        data-testid="signup-button"
        aria-disabled={loading}
        aria-label="Submit signup form"
      >
        {loading ? "Loading..." : "Sign Up"}
      </Button>
    </form>
  );
}
