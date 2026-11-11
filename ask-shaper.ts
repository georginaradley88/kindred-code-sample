export const ASK_TYPES = ["carry", "collect", "checkin", "company", "pets"] as const;

export type AskCategory = (typeof ASK_TYPES)[number];

export interface ShapedAsk {
  title: string;
  category: AskCategory;
  minutes: number;
}

const DEFAULT_CATEGORY: AskCategory = "company";
const ALLOWED_MINUTES = [10, 15, 20, 30] as const;

function closestAllowedMinutes(value: number) {
  const safeValue = Number.isFinite(value) ? Math.min(30, Math.max(10, value)) : 15;
  return ALLOWED_MINUTES.reduce((closest, option) =>
    Math.abs(option - safeValue) < Math.abs(closest - safeValue) ? option : closest,
  );
}

export function normalizeShapedAsk(input: {
  title?: unknown;
  category?: unknown;
  minutes?: unknown;
}): ShapedAsk {
  const title = typeof input.title === "string" ? input.title.trim().replace(/\s+/g, " ") : "";
  const category = ASK_TYPES.includes(input.category as AskCategory)
    ? (input.category as AskCategory)
    : DEFAULT_CATEGORY;
  const minutes = closestAllowedMinutes(Number(input.minutes));

  return {
    title: title.slice(0, 120),
    category,
    minutes,
  };
}
