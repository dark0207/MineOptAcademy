/** lower-case url-safe slug, e.g. "Pit-by-Pit NPV" becomes "pit-by-pit-npv" */
export function slugify(text: string): string {
  const slug = text
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "item";
}

/** appends -2, -3, ... until `exists` says the slug is free */
export async function uniqueSlug(base: string, exists: (slug: string) => Promise<boolean>): Promise<string> {
  let candidate = base;
  for (let i = 2; await exists(candidate); i++) {
    candidate = `${base}-${i}`;
  }
  return candidate;
}
