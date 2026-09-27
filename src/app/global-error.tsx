"use client";

import "./globals.css";
import { HTML_LANG, messages } from "@/presentation/i18n";

const copy = messages.shell.globalError;

/** Last-resort fallback when the root layout itself fails; renders without providers. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang={HTML_LANG}>
      <body className="flex min-h-dvh items-center justify-center bg-navy-darker p-4 font-sans text-sand">
        <main className="max-w-md text-center">
          <p className="text-2xl font-extrabold tracking-wider text-orange-on-navy">{messages.common.brand}</p>
          <h1 className="mt-6 text-2xl">{copy.title}</h1>
          <p className="mt-3 text-sand/85">{copy.description}</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-orange px-6 font-bold text-navy-deep hover:bg-orange-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-on-navy focus-visible:ring-offset-2 focus-visible:ring-offset-navy-darker"
          >
            {copy.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
