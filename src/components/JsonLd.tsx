// Structured data for search engines (schema.org), one script per item. `<` is escaped so text from
// listings can't close the tag.
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <>
      {(Array.isArray(data) ? data : [data]).map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(item).replace(/</g, "\\u003c") }} />
      ))}
    </>
  );
}
