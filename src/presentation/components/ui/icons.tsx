import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** Sizing and color classes. Defaults to "size-5"; color follows currentColor. */
  className?: string;
}

interface BaseIconProps extends IconProps {
  children: ReactNode;
}

/** Decorative 24×24 outline icon. Pass aria-hidden={false} plus a <title> only when the icon stands alone. */
function BaseIcon({ className = "size-5", children, ...props }: BaseIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></BaseIcon>;
}

export function CloseIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M6 18 18 6M6 6l12 12" /></BaseIcon>;
}

export function CartIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
    </BaseIcon>
  );
}

export function PlusIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M12 4.5v15m7.5-7.5h-15" /></BaseIcon>;
}

export function MinusIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M5 12h14" /></BaseIcon>;
}

export function TrashIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
    </BaseIcon>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="m8.25 4.5 7.5 7.5-7.5 7.5" /></BaseIcon>;
}

export function ChevronDownIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="m19.5 8.25-7.5 7.5-7.5-7.5" /></BaseIcon>;
}

export function CheckIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="m4.5 12.75 6 6 9-13.5" /></BaseIcon>;
}

export type StarFill = "full" | "half" | "empty";

export interface StarIconProps extends IconProps {
  fill?: StarFill;
}

const STAR_POINTS = "12 2.5 14.94 8.46 21.5 9.41 16.75 14.04 17.87 20.58 12 17.5 6.13 20.58 7.25 14.04 2.5 9.41 9.06 8.46";
const STAR_LEFT_HALF_POINTS = "12 2.5 12 17.5 6.13 20.58 7.25 14.04 2.5 9.41 9.06 8.46";

/** Rating star: "full" is solid, "empty" is an outline, "half" fills the left half. */
export function StarIcon({ fill = "full", ...props }: StarIconProps) {
  return (
    <BaseIcon {...props}>
      <polygon points={STAR_POINTS} fill={fill === "full" ? "currentColor" : "none"} />
      {fill === "half" && <polygon points={STAR_LEFT_HALF_POINTS} fill="currentColor" />}
    </BaseIcon>
  );
}

export function TruckIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </BaseIcon>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </BaseIcon>
  );
}

export function ReturnIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" /></BaseIcon>;
}

export function MailIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
    </BaseIcon>
  );
}

export function ClockIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></BaseIcon>;
}

export function InfoIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </BaseIcon>
  );
}

export function AlertCircleIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
    </BaseIcon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></BaseIcon>;
}

export function PackageIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </BaseIcon>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
    </BaseIcon>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </BaseIcon>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return <BaseIcon {...props}><path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></BaseIcon>;
}
