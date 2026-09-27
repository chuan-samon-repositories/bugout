import Link from "next/link";
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "./cn";
import { Spinner } from "./Spinner";

/**
 * primary: brand orange with navy text (the main call to action).
 * secondary: navy outline that fills on hover, for light backgrounds.
 * inverse / outline-inverse: solid sand and sand outline, for dark (navy) backgrounds.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "outline-inverse";
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

/** Orange (accent) bold text link, e.g. "Ver todo el catálogo →" under a section. */
export const textLinkClasses = cn(
  "inline-flex items-center gap-1.5 rounded-sm text-[0.90625rem] font-bold text-accent underline-offset-4 hover:text-accent-hover hover:underline",
  focusRing,
);

/** Lift on hover, only for enabled controls. */
const lift = "hover:-translate-y-0.5 disabled:hover:translate-y-0 aria-disabled:hover:translate-y-0";

const variantClasses: Record<ButtonVariant, string> = {
  primary: cn("bg-orange text-navy-deep shadow-cta hover:bg-orange-hover", lift),
  secondary: cn("border-[1.5px] border-navy-deep bg-transparent text-navy-deep hover:bg-navy-deep hover:text-white", lift),
  ghost: "bg-transparent text-navy-deep hover:bg-sand-dim/60",
  danger: "bg-danger text-white hover:bg-danger/90",
  inverse: cn("bg-sand text-navy-deep hover:bg-white", lift),
  "outline-inverse": cn("border-[1.5px] border-sand/40 bg-transparent text-sand hover:border-sand hover:bg-sand hover:text-navy-deep", lift),
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-9 px-4 text-[0.8125rem]",
  md: "min-h-11 px-6 text-sm",
  lg: "min-h-13 px-8 text-[0.9375rem]",
};

/** Class list used by Button and ButtonLink; exported for rare custom elements. */
export function buttonClasses({ variant = "primary", size = "md", fullWidth = false, className }: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full text-center font-bold tracking-[0.01em]",
    "transition-[transform,background-color,border-color,color,box-shadow] duration-250 ease-brand",
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
  ghost: "text-navy-deep hover:bg-sand-dim/60",
  inverse: "bg-white/8 text-sand hover:bg-white/18",
  primary: "bg-orange text-navy-deep hover:bg-orange-hover",
  secondary: "border-[1.5px] border-navy-deep text-navy-deep hover:bg-navy-deep hover:text-white",
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
