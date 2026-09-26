"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ContactMessage, ContactTopic } from "@/application/dtos/Contact";
import { FormValidationError, type FieldErrors } from "@/application/errors";
import { CONTACT_MESSAGE_MAX_LENGTH, CONTACT_MESSAGE_MIN_LENGTH } from "@/application/use-cases";
import { getContainer } from "@/infrastructure/config";
import {
  Button,
  CheckCircleIcon,
  SelectField,
  TextAreaField,
  TextField,
  type SelectOption,
} from "@/presentation/components/ui";
import { useAnalytics } from "@/presentation/context/AnalyticsContext";
import { messages } from "@/presentation/i18n";
import { CONTACT_TOPICS, isContactTopic } from "./contactTopics";
import { focusFirstInvalidField } from "./focusField";
import { FormErrorSummary, type FormErrorSummaryItem } from "./FormErrorSummary";
import { orderFieldErrors, validationMessage } from "./validationMessages";

type ContactField = keyof ContactMessage;

const FIELD_ORDER: readonly ContactField[] = ["name", "email", "topic", "subject", "message"];

const EMPTY_MESSAGE: ContactMessage = { name: "", email: "", topic: "general", subject: "", message: "" };

const copy = messages.forms.contact;
const fieldId = (field: string) => `contact-${field}`;
const topicOptions: SelectOption[] = CONTACT_TOPICS.map((topic) => ({ value: topic, label: copy.topics[topic] }));
const lengthLimits = { minLength: CONTACT_MESSAGE_MIN_LENGTH, maxLength: CONTACT_MESSAGE_MAX_LENGTH };

export interface ContactFormProps {
  /** Preselected topic, e.g. from `/contact?topic=order`. */
  initialTopic?: ContactTopic;
}

export function ContactForm({ initialTopic = "general" }: ContactFormProps) {
  const analytics = useAnalytics();
  const initialValues: ContactMessage = { ...EMPTY_MESSAGE, topic: initialTopic };
  const [values, setValues] = useState<ContactMessage>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ ids: string[] } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusRequest) focusFirstInvalidField(focusRequest.ids);
  }, [focusRequest]);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const update = <K extends ContactField>(field: K, value: ContactMessage[K]) =>
    setValues((current) => ({ ...current, [field]: value }));

  const errorFor = (field: ContactField) => {
    const code = errors[field];
    return code ? validationMessage(code, lengthLimits) : null;
  };

  const ordered = orderFieldErrors(errors, FIELD_ORDER);
  const summary: FormErrorSummaryItem[] = ordered.map(([field, code]) => ({
    fieldId: fieldId(field),
    label: copy.fields[field as ContactField] ?? field,
    message: validationMessage(code, lengthLimits),
  }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await getContainer().getSendContactMessageUseCase().execute(values);
      analytics.track({ name: "contact_message_sent", properties: { topic: values.topic } });
      setErrors({});
      setSent(true);
    } catch (error) {
      if (error instanceof FormValidationError) {
        setErrors(error.fieldErrors);
        setFocusRequest({ ids: orderFieldErrors(error.fieldErrors, FIELD_ORDER).map(([field]) => fieldId(field)) });
      } else {
        setErrors({});
        setFormError(messages.errors.generic);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setFormError(null);
    setSent(false);
    setFocusRequest({ ids: [fieldId("name")] });
  };

  if (sent) {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className="rounded-lg border border-success bg-white p-6 focus-visible:outline-none"
      >
        <p className="flex items-start gap-2 text-lg font-semibold text-success">
          <CheckCircleIcon className="mt-1 size-5 shrink-0" />
          <span className="min-w-0">{copy.successTitle}</span>
        </p>
        <p className="mt-2 text-ink">{copy.successText}</p>
        <Button variant="secondary" className="mt-6" onClick={reset}>
          {copy.sendAnother}
        </Button>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="min-w-0">
      <FormErrorSummary errors={summary} className={summary.length > 0 ? "mb-5" : undefined} />
      <div className="flex flex-col gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id={fieldId("name")}
            name="name"
            label={copy.fields.name}
            autoComplete="name"
            required
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            error={errorFor("name")}
          />
          <TextField
            id={fieldId("email")}
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            label={copy.fields.email}
            required
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            error={errorFor("email")}
          />
        </div>
        <SelectField
          id={fieldId("topic")}
          name="topic"
          label={copy.fields.topic}
          required
          options={topicOptions}
          value={values.topic}
          onChange={(event) => {
            if (isContactTopic(event.target.value)) update("topic", event.target.value);
          }}
          error={errorFor("topic")}
        />
        <TextField
          id={fieldId("subject")}
          name="subject"
          label={copy.fields.subject}
          required
          maxLength={200}
          value={values.subject}
          onChange={(event) => update("subject", event.target.value)}
          error={errorFor("subject")}
        />
        <TextAreaField
          id={fieldId("message")}
          name="message"
          label={copy.fields.message}
          required
          rows={7}
          maxLength={CONTACT_MESSAGE_MAX_LENGTH}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          error={errorFor("message")}
          hint={
            <span className="flex flex-wrap justify-between gap-x-4">
              <span>{copy.messageHint(CONTACT_MESSAGE_MIN_LENGTH)}</span>
              <span>{copy.messageCounter(values.message.length, CONTACT_MESSAGE_MAX_LENGTH)}</span>
            </span>
          }
        />
        {formError && (
          <p role="alert" className="text-sm font-medium text-danger">
            {formError}
          </p>
        )}
        <div>
          <Button type="submit" size="lg" loading={submitting}>
            {copy.submit}
          </Button>
        </div>
      </div>
    </form>
  );
}
