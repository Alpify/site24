import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-white shadow-sm hover:bg-accent-hover focus-visible:ring-2 focus-visible:ring-ring",
  secondary:
    "border border-border bg-card text-foreground shadow-sm hover:bg-background",
  ghost: "text-muted hover:text-foreground hover:bg-card/80",
};

export function buttonClassName(variant: Variant = "primary", className = "") {
  return `inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${variants[variant]} ${className}`;
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={buttonClassName(variant, className)}
      {...props}
    />
  );
}
