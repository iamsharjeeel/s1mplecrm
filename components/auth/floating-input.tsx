"use client";

import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function FloatingInput({
  label,
  className,
  id,
  ...props
}: FloatingInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="group-input relative w-full">
      <input
        id={inputId}
        placeholder=" "
        className={cn(
          "peer block w-full rounded border border-secondary-container bg-surface-container-lowest px-4 py-3 text-base text-on-surface transition-colors placeholder-transparent focus:border-primary-container focus:ring-0 focus:outline-none",
          className,
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className="pointer-events-none absolute top-3 left-3 origin-left px-1 text-base text-on-surface-variant transition-all duration-200 ease-in-out peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:bg-surface-container-lowest peer-focus:text-primary-container peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:bg-surface-container-lowest peer-[:not(:placeholder-shown)]:text-outline"
      >
        {label}
      </label>
    </div>
  );
}
