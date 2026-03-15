/**
 * Generate a URL-friendly slug from a string.
 */
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')    // Remove non-word chars
    .replace(/[\s_]+/g, '-')     // Replace spaces/underscores with hyphens
    .replace(/-+/g, '-')         // Remove duplicate hyphens
    .replace(/^-+|-+$/g, '');    // Trim hyphens from start/end
};

/**
 * Generate a unique slug by appending a random suffix.
 */
export const generateUniqueSlug = (text: string): string => {
  const base = generateSlug(text);
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
};
