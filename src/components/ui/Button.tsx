import { type ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-teal-700 text-white shadow-sm hover:bg-teal-800 focus-visible:ring-teal-500",
  secondary:
    "border border-stone-300 bg-white text-stone-700 hover:bg-stone-50 focus-visible:ring-teal-500",
  ghost: "text-stone-600 hover:bg-stone-100 focus-visible:ring-teal-500",
  danger:
    "bg-rose-600 text-white shadow-sm hover:bg-rose-700 focus-visible:ring-rose-500",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    />
  );
});
