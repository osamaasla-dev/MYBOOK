import { z } from "zod";

const cuidSchema = z.string().cuid();

export function validateCuid(value?: string) {
  return cuidSchema.safeParse(value);
}
