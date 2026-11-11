interface AskRuleShape {
  status: string;
  author_id: string;
  helper_id: string | null;
}

/** Anyone except the asker can offer help on an open ask. */
export function canAccept(ask: AskRuleShape, userId: string) {
  return ask.status === "open" && ask.author_id !== userId;
}

/** Verified rule: only the person who asked can confirm help was done — never the helper. */
export function canConfirm(ask: AskRuleShape, userId: string) {
  return (
    ask.status === "accepted" &&
    ask.author_id === userId &&
    ask.helper_id !== null &&
    ask.helper_id !== userId
  );
}

/** Points for each distinct recipient-confirmed act. Awarded once, server-side, to the helper. */
export const POINTS_PER_ACT = 10;

const LONDON = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" });

/** Monday (YYYY-MM-DD) of the Europe/London calendar week containing this moment. */
export function londonWeekStart(at: string | Date): string {
  const [y = 1970, m = 1, d = 1] = LONDON.format(new Date(at)).split("-").map(Number);
  const day = new Date(Date.UTC(y, m - 1, d));
  day.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  return day.toISOString().slice(0, 10);
}

function previousWeek(monday: string) {
  const day = new Date(`${monday}T00:00:00Z`);
  day.setUTCDate(day.getUTCDate() - 7);
  return day.toISOString().slice(0, 10);
}

/**
 * Weekly streak: consecutive London weeks (Mon–Sun) with at least one confirmed act,
 * ending this week, or last week if this week has none yet. Mirrors kindness_summary_for().
 */
export function computeWeeklyStreak(confirmedAt: (string | Date)[], now: Date = new Date()) {
  const weeks = new Set(confirmedAt.map(londonWeekStart));
  let cursor = londonWeekStart(now);
  if (!weeks.has(cursor)) cursor = previousWeek(cursor);
  let streak = 0;
  while (weeks.has(cursor)) {
    streak += 1;
    cursor = previousWeek(cursor);
  }
  return streak;
}
