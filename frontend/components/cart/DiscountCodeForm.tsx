"use client";

import { useState } from "react";
import { Alert, Button, Input } from "antd";
import { TicketPercent, X } from "lucide-react";
import { useCart } from "./CartProvider";
import { describeDiscount } from "@/lib/discounts";
import { formatMoney } from "@/lib/format";

/** Enter a discount code, or see and remove the one already applied. */
export default function DiscountCodeForm() {
  const { cart, applyDiscount, removeDiscount } = useCart();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const discount = cart?.discount ?? null;

  async function handleApply() {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setBusy(true);
    try {
      await applyDiscount(trimmed);
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code couldn't be applied.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await removeDiscount();
    } finally {
      setBusy(false);
    }
  }

  if (discount) {
    const applied = discount.status === "Applied";
    return (
      <div className="flex flex-col gap-2">
        <div
          className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
            applied ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
          }`}
        >
          <TicketPercent className={`h-4 w-4 shrink-0 ${applied ? "text-green-700" : "text-amber-700"}`} />
          <div className="min-w-0 flex-1 text-sm">
            <span className="font-semibold text-zinc-900">{discount.code}</span>
            <span className="text-zinc-600"> · {describeDiscount(discount.kind, discount.value)}</span>
            {applied && (
              <span className="block text-xs text-green-700">
                You&apos;re saving {formatMoney(discount.amount)} on this order.
              </span>
            )}
          </div>
          <Button
            type="text"
            size="small"
            icon={<X className="h-4 w-4" />}
            aria-label={`Remove discount code ${discount.code}`}
            loading={busy}
            onClick={handleRemove}
          />
        </div>
        {!applied && discount.message && <Alert type="warning" showIcon title={discount.message} />}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError(null);
          }}
          onPressEnter={handleApply}
          placeholder="Discount code"
          prefix={<TicketPercent className="h-4 w-4 text-zinc-400" />}
          status={error ? "error" : undefined}
          disabled={busy}
          aria-label="Discount code"
        />
        <Button onClick={handleApply} loading={busy} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
