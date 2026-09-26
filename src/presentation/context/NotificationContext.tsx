"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
} from "react";
import { IconButton } from "@/presentation/components/ui/Button";
import { cn } from "@/presentation/components/ui/cn";
import { AlertCircleIcon, CheckCircleIcon, CloseIcon, InfoIcon } from "@/presentation/components/ui/icons";
import { messages } from "@/presentation/i18n";

export type NotificationTone = "success" | "error" | "info";

export interface NotificationAction {
  label: string;
  /** Renders the action as a link. */
  href?: string;
  onClick?: () => void;
}

export interface NotifyOptions {
  tone: NotificationTone;
  title?: string;
  message: string;
  action?: NotificationAction;
  /** Auto-dismiss delay. Defaults to 5000 (8000 for errors). 0 or Infinity keeps it until dismissed. */
  durationMs?: number;
}

export interface Notification extends NotifyOptions {
  id: string;
}

export interface NotificationContextValue {
  /** Shows a toast and returns its id. */
  notify: (options: NotifyOptions) => string;
  dismiss: (id: string) => void;
}

export const DEFAULT_DURATION_MS = 5000;
export const ERROR_DURATION_MS = 8000;
export const MAX_VISIBLE_NOTIFICATIONS = 3;

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setNotifications((current) => current.filter((notification) => notification.id !== id));
  }, []);

  const notify = useCallback((options: NotifyOptions) => {
    counter.current += 1;
    const id = `notification-${counter.current}`;
    setNotifications((current) => [...current, { ...options, id }].slice(-MAX_VISIBLE_NOTIFICATIONS));
    return id;
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster notifications={notifications} onDismiss={dismiss} />
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a <NotificationProvider>.");
  }
  return context;
}

interface ToasterProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

/**
 * Live regions are always mounted so screen readers announce toasts added later:
 * success/info go to a polite region, errors to a role="alert" region.
 */
function Toaster({ notifications, onDismiss }: ToasterProps) {
  const polite = notifications.filter((notification) => notification.tone !== "error");
  const errors = notifications.filter((notification) => notification.tone === "error");

  return (
    <section
      aria-label={messages.common.notifications.region}
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:items-end"
    >
      <div role="alert" aria-atomic="false" className="flex w-full flex-col items-center gap-2 sm:items-end">
        {errors.map((notification) => (
          <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </div>
      <div aria-live="polite" className="flex w-full flex-col items-center gap-2 sm:items-end">
        {polite.map((notification) => (
          <Toast key={notification.id} notification={notification} onDismiss={onDismiss} />
        ))}
      </div>
    </section>
  );
}

const toneStyles: Record<NotificationTone, { border: string; icon: string }> = {
  success: { border: "border-l-success", icon: "text-success" },
  error: { border: "border-l-danger", icon: "text-danger" },
  info: { border: "border-l-navy", icon: "text-navy" },
};

const toneIcons = {
  success: CheckCircleIcon,
  error: AlertCircleIcon,
  info: InfoIcon,
} as const;

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function Toast({ notification, onDismiss }: ToastProps) {
  const { id, tone, title, message, action } = notification;
  const duration = notification.durationMs ?? (tone === "error" ? ERROR_DURATION_MS : DEFAULT_DURATION_MS);
  const autoDismiss = Number.isFinite(duration) && duration > 0;

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const paused = hovered || focused;
  const remaining = useRef(duration);

  useEffect(() => {
    if (!autoDismiss || paused) return;
    const startedAt = Date.now();
    const timer = setTimeout(() => onDismiss(id), Math.max(0, remaining.current));
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt;
    };
  }, [autoDismiss, paused, id, onDismiss]);

  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
  };

  const Icon = toneIcons[tone];
  const styles = toneStyles[tone];
  const actionClasses =
    "mt-2 inline-flex min-h-11 items-center rounded-sm text-sm font-semibold text-accent underline underline-offset-4 hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

  const runAction = () => {
    action?.onClick?.();
    onDismiss(id);
  };

  return (
    <div
      data-notification-tone={tone}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={onBlur}
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-l-4 border-sand bg-white py-2 pl-4 pr-1 shadow-lg animate-fade-in",
        styles.border,
      )}
    >
      <Icon className={cn("mt-2.5 size-5 shrink-0", styles.icon)} />
      <div className="min-w-0 flex-1 py-2">
        {title && <p className="font-semibold text-ink">{title}</p>}
        <p className={cn("text-sm text-ink", title && "mt-0.5")}>{message}</p>
        {action &&
          (action.href ? (
            <Link href={action.href} onClick={runAction} className={actionClasses}>
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={runAction} className={actionClasses}>
              {action.label}
            </button>
          ))}
      </div>
      <IconButton label={messages.common.notifications.dismiss} onClick={() => onDismiss(id)}>
        <CloseIcon className="size-5" />
      </IconButton>
    </div>
  );
}
