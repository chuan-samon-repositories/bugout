import type { ReactNode } from "react";
import { siteConfig } from "@/presentation/config/site";
import { messages } from "@/presentation/i18n";

interface IdentityField {
  key: "name" | "taxId" | "address" | "email";
  label: string;
  value: string;
}

/** The business identity fields that are configured, in display order. */
export function businessIdentityFields(): IdentityField[] {
  const labels = messages.content.businessIdentity;
  const candidates: Array<{ key: IdentityField["key"]; value: string | null }> = [
    { key: "name", value: siteConfig.legal.name },
    { key: "taxId", value: siteConfig.legal.taxId },
    { key: "address", value: siteConfig.legal.address },
    { key: "email", value: siteConfig.contactEmail },
  ];
  return candidates.flatMap(({ key, value }) => (value ? [{ key, label: labels[key], value }] : []));
}

export interface BusinessIdentityProps {
  /** Rendered instead when no identity field is configured. */
  fallback?: ReactNode;
}

/** Seller identity (LSSI art. 10). Shows only configured fields; renders the fallback (or nothing) otherwise. */
export function BusinessIdentity({ fallback = null }: BusinessIdentityProps) {
  const fields = businessIdentityFields();
  if (fields.length === 0) return <>{fallback}</>;
  return (
    <dl className="my-6 grid gap-x-6 gap-y-2 rounded-lg border border-sand p-4 sm:grid-cols-[auto_1fr]">
      {fields.map((field) => (
        <div key={field.key} className="contents">
          <dt className="font-semibold text-ink">{field.label}</dt>
          <dd className="min-w-0 break-words text-ink">
            {field.key === "email" ? <a href={`mailto:${field.value}`}>{field.value}</a> : field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
