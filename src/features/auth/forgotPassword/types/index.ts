import type { ForgotPasswordValues } from "../schemas";

export interface ForgotPasswordFormProps {
  onSubmit: (values: ForgotPasswordValues) => void | Promise<void>;
  loading?: boolean;
  className?: string;
}
