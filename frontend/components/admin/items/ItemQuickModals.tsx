"use client";

import { useState } from "react";
import { Alert, Button, Form, InputNumber, Modal } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import { setInventory, setSalePrice } from "@/lib/services/admin-service";
import { formatMoney } from "@/lib/format";
import { Item } from "@/lib/types";

interface QuickModalProps {
  item: Item;
  onClose: () => void;
  onSaved: (item: Item, message: string) => void;
}

/**
 * Puts one item on sale, changes its sale price, or ends the sale
 * (PUT /items/{id}/sale). Carts pick up the new price on their next read.
 */
export function SaleModal({ item, onClose, onSaved }: QuickModalProps) {
  const { token } = useAuth();
  const [form] = Form.useForm<{ salePrice: number }>();
  const [saving, setSaving] = useState<"save" | "end" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(salePrice: number | null) {
    if (!token) return;
    setError(null);
    setSaving(salePrice === null ? "end" : "save");
    try {
      const updated = await setSalePrice(token, item.id, salePrice);
      onSaved(
        updated,
        salePrice === null
          ? `${item.name} is no longer on sale.`
          : `${item.name} is now on sale for ${formatMoney(salePrice)}.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "The sale couldn't be saved.");
      setSaving(null);
    }
  }

  return (
    <Modal
      open
      title={item.isOnSale ? "Edit sale" : "Put on sale"}
      onCancel={onClose}
      mask={{ closable: !saving }}
      footer={
        <div className="flex justify-between gap-2">
          <div>
            {item.isOnSale && (
              <Button danger loading={saving === "end"} disabled={saving !== null} onClick={() => save(null)}>
                End sale
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={onClose} disabled={saving !== null}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" form="sale-form" loading={saving === "save"} disabled={saving !== null}>
              {item.isOnSale ? "Update sale price" : "Start sale"}
            </Button>
          </div>
        </div>
      }
    >
      <p className="mb-4 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">{item.name}</span> · regular price {formatMoney(item.price)}
      </p>
      <Form
        id="sale-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ salePrice: item.salePrice ?? undefined }}
        onFinish={(values) => save(values.salePrice)}
      >
        {error && <Alert type="error" showIcon title={error} className="mb-4" />}
        <Form.Item
          label="Sale price"
          name="salePrice"
          extra="Customers see a Sale badge, and every cart holding this item is charged the sale price."
          rules={[
            { required: true, message: "Set the sale price." },
            {
              validator: (_, value: number | undefined) =>
                value == null || value < item.price
                  ? Promise.resolve()
                  : Promise.reject(new Error("The sale price must be lower than the regular price.")),
            },
          ]}
        >
          <InputNumber prefix="$" min={0} precision={2} step={1} autoFocus className="w-48" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

/** Sets how many of one item are in stock (PUT /items/{id}/inventory). */
export function StockModal({ item, onClose, onSaved }: QuickModalProps) {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(values: { quantityAvailable: number }) {
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const updated = await setInventory(token, item.id, values.quantityAvailable);
      onSaved(updated, `${item.name} now has ${updated.quantityAvailable} in stock.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The stock couldn't be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title="Update stock"
      onCancel={onClose}
      okText="Save stock"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "stock-form" }}
      cancelButtonProps={{ disabled: saving }}
      mask={{ closable: !saving }}
    >
      <p className="mb-4 text-sm text-zinc-600">
        <span className="font-medium text-zinc-900">{item.name}</span> · currently {item.quantityAvailable} in stock
      </p>
      <Form
        id="stock-form"
        layout="vertical"
        requiredMark={false}
        initialValues={{ quantityAvailable: item.quantityAvailable }}
        onFinish={save}
        disabled={saving}
      >
        {error && <Alert type="error" showIcon title={error} className="mb-4" />}
        <Form.Item
          label="Quantity available"
          name="quantityAvailable"
          extra="Shown on the main sale page. Zero marks the item out of stock."
          rules={[{ required: true, message: "Set the stock." }]}
        >
          <InputNumber min={0} precision={0} autoFocus className="w-48" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
