import { formatDate, formatMoney } from "@/lib/format";
import { DiscountCode, DiscountKind } from "@/lib/types";

/** "15% off" or "$25.00 off". */
export function describeDiscount(kind: DiscountKind, value: number): string {
  return kind === "Percentage" ? `${value}% off` : `${formatMoney(value)} off`;
}

export type DiscountCodeState = "Active" | "Scheduled" | "Expired" | "Disabled";

/**
 * Where a code stands right now, for a status tag. `isCurrentlyValid` comes
 * from the API; the dates only distinguish "not started" from "ended".
 */
export function discountCodeState(code: DiscountCode, now = new Date()): DiscountCodeState {
  if (!code.isActive) return "Disabled";
  if (code.isCurrentlyValid) return "Active";
  if (code.startsAt && new Date(code.startsAt) > now) return "Scheduled";
  return "Expired";
}

/** "Mar 1, 2027 – Mar 31, 2027", "From Mar 1, 2027", "Until …", or "Always". */
export function describeWindow(startsAt: string | null, endsAt: string | null): string {
  if (startsAt && endsAt) return `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
  if (startsAt) return `From ${formatDate(startsAt)}`;
  if (endsAt) return `Until ${formatDate(endsAt)}`;
  return "No end date";
}

/*
 * The form uses native date inputs ("YYYY-MM-DD", the admin's local time).
 * A start date means the beginning of that day; an end date, the end of it.
 */

export function dateInputToStartIso(value: string | undefined): string | null {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

export function dateInputToEndIso(value: string | undefined): string | null {
  return value ? new Date(`${value}T23:59:59.999`).toISOString() : null;
}

export function isoToDateInput(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
