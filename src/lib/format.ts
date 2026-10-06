// One place for monetary, numeric and date formatting so the screen, charts
// and exported reports always agree on currency, grouping and precision.

/**
 * The original demo fixtures were priced in US dollars. They were converted
 * once to Indian rupees at this explicit reference rate.
 * EUR/INR 110.7285 ÷ EUR/USD 1.1539 = 95.96 (ECB euro reference rates).
 */
export const USD_TO_INR = {
  rate: 95.96,
  date: "15 Sep 2026",
  source:
    "European Central Bank euro reference rates (EUR/INR ÷ EUR/USD), 15 Sep 2026",
} as const;

export const CURRENCY = "INR";

export const conversionNote = `Prices are illustrative. They were converted from US$ demo values at ₹${USD_TO_INR.rate} = US$1 (${USD_TO_INR.source}). GST and delivery are not included.`;

const inrFormatters = new Map<number, Intl.NumberFormat>();
/** ₹1,25,000.00 style formatting with Indian digit grouping. */
export function formatINR(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  let f = inrFormatters.get(decimals);
  if (!f) {
    f = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    inrFormatters.set(decimals, f);
  }
  return f.format(value);
}

/** Round to paise; used when storing converted prices. */
export const toPaise = (value: number) => Math.round(value * 100) / 100;

export const usdToInr = (value: number) => toPaise(value * USD_TO_INR.rate);

export function formatNumber(value: number | null | undefined, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Decimal places used in a number as entered (0.40 → 2 only if typed; 0.4 → 1). */
export function decimalsOf(value: number) {
  if (!Number.isFinite(value)) return 0;
  const text = String(value);
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.includes(".") ? text.split(".")[1].length : 0;
}

/**
 * A mean is shown with the same precision as its most precise reading, so
 * readings of 31, 32 and 33 give "32", not "32.000".
 */
export function formatMeasured(
  value: number | null | undefined,
  readings: (number | null)[] = [],
) {
  if (value === null || value === undefined || !Number.isFinite(value))
    return "—";
  const nums = readings.filter((x): x is number => x !== null);
  const decimals = Math.min(
    3,
    nums.length ? Math.max(...nums.map(decimalsOf)) : decimalsOf(value),
  );
  return formatNumber(value, decimals);
}

export function formatDate(value: string | number | undefined) {
  if (value === undefined || value === "") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;
