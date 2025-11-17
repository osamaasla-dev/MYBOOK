export interface SignUpFormProps {
  onSubmit: (values: import("../schemas").SignUpInput) => void;
  loading?: boolean;
}
