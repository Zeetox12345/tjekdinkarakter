
export const cleanContent = (text: string): string => {
  let cleaned = text
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/^\uFEFF/, '') // Remove BOM
    .replace(/\u0000/g, '') // Remove null bytes
    .replace(/[\uFFFD\uFFFE\uFFFF]/g, '') // Remove Unicode replacement characters
    .trim();

  // Ensure we have valid content after cleaning
  if (!cleaned) {
    throw new Error('Content is empty after cleaning');
  }

  return cleaned;
};
