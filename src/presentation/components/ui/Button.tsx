import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Shared focus ring for every interactive primitive. */
export const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border-2 border-navy bg-white text-navy hover:bg-navy hover:text-white",
  ghost: "bg-transparent text-navy hover:bg-sand",
  danger: "bg-danger text-white hover:bg-danger/90",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 text-sm",
  md: "min-h-11 px-5 text-base",
  lg: "min-h-12 px-6 text-lg",
};

/** Class list used by Button and ButtonLink; exported for rare custom elements. */
export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className }: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:cursor-not-allowed aria-disabled:opacity-60",
    focusRing,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps extends ComponentPropsWithRef<"button">, ButtonStyleOptions {
  /** Shows a spinner, sets aria-busy and disables the button. */
  loading?: boolean;
}

export function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {loading && <Spinner size="sm" decorative />}
      {children}
    </button>
  );
}

export type ButtonLinkProps = ComponentPropsWithRef<typeof Link> & ButtonStyleOptions;

/** A next/link styled as a Button. */
export function ButtonLink({ variant, size, fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses({ variant, size, fullWidth, className })} {...props} />;
}

export type IconButtonVariant = "ghost" | "inverse" | "primary" | "secondary";

export interface IconButtonProps extends Omit<ComponentPropsWithRef<"button">, "aria-label" | "children"> {
  /** Accessible name, rendered as aria-label. Required: icon-only buttons have no visible text. */
  label: string;
  /** The icon (decorative). */
  children: ReactNode;
  /** "inverse" is for dark (navy) backgrounds. */
  variant?: IconButtonVariant;
}

const iconVariantClasses: Record<IconButtonVariant, string> = {
  ghost: "text-navy hover:bg-sand",
  inverse: "text-white hover:bg-white/10",
  primary: "bg-accent text-white hover:bg-accent-hover",
  secondary: "border-2 border-navy text-navy hover:bg-navy hover:text-white",
};

/** Icon-only button with a guaranteed 44×44px touch target. */
export function IconButton({ label, variant = "ghost", type = "button", className, children, ...props }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-full transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        focusRing,
        iconVariantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
