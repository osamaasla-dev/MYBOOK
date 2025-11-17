import type { ResetPasswordValues } from "../schemas";

export interface ResetPasswordFormProps {
  onSubmit: (values: ResetPasswordValues) => void | Promise<void>;
  loading?: boolean;
  className?: string;
}
