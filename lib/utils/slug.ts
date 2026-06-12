export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateEventSlug(title: string): string {
  const base = slugify(title);
  const suffix = Date.now().toString(36).slice(-4);
  return `${base}-${suffix}`;
}
