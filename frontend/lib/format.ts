const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

/** Formats an amount the API already computed, e.g. 1299 -> "$1,299.00". */
export function formatMoney(amount: number): string {
  return currency.format(amount);
}

const dateTime = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

/** "Nov 8, 2026, 4:20 PM" in the viewer's time zone. */
export function formatDateTime(iso: string): string {
  return dateTime.format(new Date(iso));
}

/** "Nov 8, 2026". */
export function formatDate(iso: string): string {
  return dateOnly.format(new Date(iso));
}

/** A short, readable order reference from its GUID, e.g. "#01A19E22". */
export function orderReference(id: string): string {
  return `#${id.replace(/-/g, "").slice(-8).toUpperCase()}`;
}
