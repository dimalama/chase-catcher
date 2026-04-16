/**
 * Calculates percentage completion, clamped to 0–100.
 */
export const calculateProgress = (current: number, total: number): number => {
  if (total <= 0) return 0;
  if (current >= total) return 100;
  return Math.round((current / total) * 100);
};
