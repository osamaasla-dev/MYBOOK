"use client";
import { useId } from "react";

type Option = {
  value: string;
  label: string;
};

type SelectFieldProps = {
  id?: string;
  label: string;
  disabled?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  labelHidden?: boolean;
  variant?: "default" | "bare";
  containerClassName?: string;
  selectClassName?: string;
  ariaInvalid?: boolean;
  ariaDescribedBy?: string;
};

export function SelectField({
  id,
  label,
  disabled,
  value,
  onChange,
  options,
  placeholder = "Select an option",
  required = false,
  labelHidden = false,
  variant = "default",
  containerClassName = "",
  selectClassName = "",
  ariaInvalid,
  ariaDescribedBy,
}: SelectFieldProps) {
  // Generate a stable id when none is provided to properly associate label and control
  const autoId = useId();
  const controlId = id ?? `select-${autoId}`;
  return (
    <div className={containerClassName}>
      {!labelHidden && (
        <label
          htmlFor={controlId}
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={controlId}
        disabled={disabled}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={ariaInvalid || undefined}
        aria-describedby={ariaDescribedBy}
        className={
          variant === "bare"
            ? `bg-transparent focus:outline-none ${selectClassName}`
            : `w-full px-3 py-2 border border-border bg-accent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary/40 ${selectClassName}`
        }
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
