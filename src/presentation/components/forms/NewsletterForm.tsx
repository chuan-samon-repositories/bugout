"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormValidationError } from "@/application/errors";
import { getContainer } from "@/infrastructure/config";
import { Button, CheckCircleIcon, cn, focusRing, InfoIcon, TextField } from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import { routes } from "@/presentation/routes";
import { validationMessage } from "./validationMessages";

export interface NewsletterFormProps {
  location: "home" | "footer";
  /** "dark" for navy backgrounds. */
  tone?: "light" | "dark";
  className?: string;
}

type Status = "idle" | "submitting" | "subscribed";

export function NewsletterForm({ location, tone = "light", className }: NewsletterFormProps) {
  const analytics = useAnalytics();
  const [simulated] = useState(() => getContainer().isMessagingSimulated());
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const confirmationRef = useRef<HTMLParagraphElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const copy = messages.forms.newsletter;
  const dark = tone === "dark";

  useEffect(() => {
    if (status === "subscribed") confirmationRef.current?.focus();
  }, [status]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setFieldError(null);
    setFormError(null);
    try {
      await getContainer().getSubscribeNewsletterUseCase().execute(email);
      analytics.track({ name: "newsletter_subscribed", properties: { location } });
      setStatus("subscribed");
    } catch (error) {
      setStatus("idle");
      if (error instanceof FormValidationError && error.fieldErrors.email) {
        setFieldError(validationMessage(error.fieldErrors.email));
        inputRef.current?.focus();
      } else {
        setFormError(messages.errors.generic);
      }
    }
  };

  return (
    <div className={cn("min-w-0", className)}>
      <div role="status">
        {status === "subscribed" && (
          <p
            ref={confirmationRef}
            tabIndex={-1}
            className={cn(
              "flex items-start gap-2 rounded-lg font-medium focus-visible:outline-none",
              dark ? "text-white" : "text-success",
            )}
          >
            <CheckCircleIcon className={cn("mt-0.5 size-5 shrink-0", dark && "text-orange-on-navy")} />
            <span className="min-w-0">{simulated ? copy.simulatedSuccess : copy.success}</span>
          </p>
        )}
      </div>
      {status !== "subscribed" && (
        <form noValidate onSubmit={handleSubmit} className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <TextField
              ref={inputRef}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              label={copy.emailLabel}
              placeholder={copy.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldError}
              className={cn(
                "sm:flex-1",
                location === "footer" && "[&>label]:sr-only",
                dark && "[&>label]:text-white [&>label>span]:text-orange-on-navy [&>p]:text-orange-on-navy",
              )}
              inputClassName={cn(dark && !fieldError && "border-sand! hover:border-white!")}
            />
            <Button
              type="submit"
              loading={status === "submitting"}
              className={cn("shrink-0", location === "home" && "sm:mt-6.5")}
            >
              {copy.submit}
            </Button>
          </div>
          {simulated && (
            <p className={cn("mt-2 flex items-start gap-2 text-sm", dark ? "text-sand" : "text-muted")}>
              <InfoIcon className={cn("mt-0.5 size-4 shrink-0", dark ? "text-orange-on-navy" : "text-navy")} />
              <span className="min-w-0">{messages.forms.simulatedNotice}</span>
            </p>
          )}
          {formError && (
            <p role="alert" className={cn("mt-2 text-sm font-medium", dark ? "text-orange-on-navy" : "text-danger")}>
              {formError}
            </p>
          )}
          <p className={cn("mt-3 text-sm", dark ? "text-sand" : "text-muted")}>
            {copy.privacyPrefix}{" "}
            <Link
              href={routes.privacy}
              className={cn(
                "rounded-sm underline underline-offset-2 hover:no-underline",
                dark ? "text-orange-on-navy" : "text-accent",
                focusRing,
              )}
            >
              {copy.privacyLink}
            </Link>
            .
          </p>
        </form>
      )}
    </div>
  );
}
