// ─────────────────────────────────────────────────────────────────────────────
// Utility: Unique ID generator (no external dep needed)
// ─────────────────────────────────────────────────────────────────────────────

export const generateId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}`;
};

export const generateShortId = (): string =>
  Math.random().toString(36).substring(2, 9);
