/**
 * Pure date-math helpers for the editorial calendar (month/week grids, query
 * string round-tripping). No date library — the app has none installed and
 * the arithmetic needed here is simple enough with native `Date`.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Weeks start on Monday (index 0) through Sunday (index 6). */
const WEEK_START_DAY = 1;

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function addDays(date: Date, amount: number): Date {
  return new Date(date.getTime() + amount * DAY_MS);
}

export function addMonths(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + amount);
  return result;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const stripped = stripTime(date);
  const day = stripped.getDay();
  const diff = (day - WEEK_START_DAY + 7) % 7;
  return addDays(stripped, -diff);
}

export function getWeekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Full weeks (Mon-Sun) covering the whole month of `anchor`, including the leading/trailing days from neighboring months. */
export function getMonthGrid(anchor: Date): CalendarDay[] {
  const today = stripTime(new Date());
  const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const lastOfMonth = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = startOfWeek(firstOfMonth);
  const gridEnd = addDays(startOfWeek(lastOfMonth), 6);

  const days: CalendarDay[] = [];
  for (let d = gridStart; d.getTime() <= gridEnd.getTime(); d = addDays(d, 1)) {
    days.push({ date: d, isCurrentMonth: d.getMonth() === anchor.getMonth(), isToday: isSameDay(d, today) });
  }
  return days;
}

export function startOfDay(date: Date): Date {
  return stripTime(date);
}

export function endOfDay(date: Date): Date {
  const start = stripTime(date);
  return new Date(start.getTime() + DAY_MS - 1);
}

export function formatMonthLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
}

export function formatWeekLabel(date: Date): string {
  const days = getWeekDays(date);
  const first = days[0];
  const last = days[6];
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt.format(first)} – ${fmt.format(last)}, ${last.getFullYear()}`;
}

export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit" }).format(date);
}

/** "YYYY-MM-DD" for `<input type="date">`, in local time (not UTC). */
export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "HH:MM" for `<input type="time">`, in local time. */
export function toTimeInputValue(date: Date): string {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Combines a "YYYY-MM-DD" + "HH:MM" pair (both local time) into a single Date. */
export function combineDateAndTime(dateValue: string, timeValue: string): Date {
  const [year, month, day] = dateValue.split("-").map(Number);
  const [hours, minutes] = timeValue.split(":").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0, 0, 0);
}

/** Moves `original` to the same time-of-day on `newDay` — used when a card is dropped onto a different day. */
export function withNewDateKeepingTime(original: Date, newDay: Date): Date {
  return new Date(
    newDay.getFullYear(),
    newDay.getMonth(),
    newDay.getDate(),
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    0
  );
}

/** Parses a "YYYY-MM-DD" query-string value into a local-time Date; falls back to today when missing/invalid. */
export function parseAnchorDate(value: string | undefined): Date {
  if (!value) return stripTime(new Date());
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return stripTime(new Date());
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? stripTime(new Date()) : parsed;
}
