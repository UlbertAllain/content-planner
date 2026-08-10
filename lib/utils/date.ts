const DEFAULT_TIME_ZONE = "Asia/Jakarta";

export function appTimeZone() {
  return process.env.APP_TIME_ZONE || DEFAULT_TIME_ZONE;
}

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function partsInTimeZone(value: Date, timeZone = appTimeZone()): DateParts {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = formatter.formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatDate(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: appTimeZone(),
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: appTimeZone(),
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}


export function formatContentSchedule(value?: Date | null, hasTime = true) {
  if (!value) return "Belum dijadwalkan";
  return hasTime ? formatDateTime(value) : formatDate(value);
}

export function formatTime(value?: Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: appTimeZone(),
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

export function dateKey(value: Date) {
  const parts = partsInTimeZone(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function toDateInputValue(value?: Date | null) {
  if (!value) return "";
  const parts = partsInTimeZone(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function toDateOnlyInputValue(value?: Date | null) {
  if (!value) return "";
  return dateKey(value);
}

/**
 * Converts an HTML datetime-local value to an absolute Date using APP_TIME_ZONE.
 * This avoids Vercel/server timezone changing the intended publishing time.
 */
export function parseDateTimeInput(value: string | Date, timeZone = appTimeZone()) {
  if (value instanceof Date) return value;
  const input = value.trim();
  if (!input) return new Date(Number.NaN);

  // Already an absolute ISO timestamp.
  if (/([zZ]|[+-]\d{2}:\d{2})$/.test(input)) return new Date(input);

  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/);
  if (!match) return new Date(input);

  const [, y, m, d, h, min, sec = "0", ms = "0"] = match;
  const desiredUtc = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(sec), Number(ms.padEnd(3, "0")));
  let guess = new Date(desiredUtc);

  // Two passes handle timezone offset resolution (and DST for zones that use it).
  for (let index = 0; index < 2; index += 1) {
    const local = partsInTimeZone(guess, timeZone);
    const representedUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
    const guessWholeSecond = Math.floor(guess.getTime() / 1000) * 1000;
    const offset = representedUtc - guessWholeSecond;
    guess = new Date(desiredUtc - offset);
  }

  return guess;
}

export function parseDateInput(value: string | Date) {
  if (value instanceof Date) return value;
  return parseDateTimeInput(`${value.trim()}T00:00:00`);
}

export function endOfLocalDate(value: string) {
  return parseDateTimeInput(`${value}T23:59:59.999`);
}
