import { serializeJsonLd, type JsonLdObject } from "./structuredData";

/** Structured data for search engines. Render it from Server Components only. */
export function JsonLd({ data }: { data: JsonLdObject | readonly JsonLdObject[] }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />;
}
