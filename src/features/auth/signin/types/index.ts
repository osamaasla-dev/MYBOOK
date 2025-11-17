export interface GoogleSignInButtonProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  className?: string;
  text?: string;
}

export interface SignInFormProps {
  onSubmit: (values: import("../schemas").SignInValues) => void;
  loading?: boolean;
}
