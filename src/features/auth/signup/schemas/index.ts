import { z } from "zod";

const MIN_AGE = 13;

function yearsBetween(from: Date, to: Date) {
  let years = to.getFullYear() - from.getFullYear();
  const m = to.getMonth() - from.getMonth();
  if (m < 0 || (m === 0 && to.getDate() < from.getDate())) years--;
  return years;
}

export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(2).max(50),
    lastName: z.string().trim().min(2).max(50),
    email: z
      .string()
      .trim()
      .email()
      .transform((v) => v.toLowerCase()),
    phone: z
      .string()
      .trim()
      .regex(/^\+?[1-9]\d{7,14}$/i, "Invalid phone number format"),
    gender: z.string().trim().toUpperCase().pipe(z.enum(["MALE", "FEMALE"])),
    birthDate: z.coerce
      .date()
      .refine((d) => yearsBetween(d, new Date()) >= MIN_AGE, "Must be 13+"),
    password: z
      .string()
      .min(8)
      .refine((v) => /[a-z]/.test(v), "Password needs a lowercase letter")
      .refine((v) => /[A-Z]/.test(v), "Password needs an uppercase letter")
      .refine((v) => /\d/.test(v), "Password needs a number")
      .refine(
        (v) => /[^A-Za-z0-9]/.test(v),
        "Password needs a special character"
      ),
    confirmPassword: z.string(),
  })
  .superRefine((val, ctx) => {
    if (val.password !== val.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type SignUpInput = z.input<typeof signUpSchema>;
