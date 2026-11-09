"use client";

import { useState } from "react";
import { Alert, Form, Input, InputNumber, Modal, Radio, Switch } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import { createDiscountCode, DiscountCodeInput, updateDiscountCode } from "@/lib/services/admin-service";
import { dateInputToEndIso, dateInputToStartIso, describeDiscount, isoToDateInput } from "@/lib/discounts";
import { formatDate, formatMoney } from "@/lib/format";
import { DiscountCode, DiscountKind } from "@/lib/types";

const MAX_AMOUNT = 99_999_999.99;

interface FormValues {
  code: string;
  description?: string;
  kind: DiscountKind;
  value?: number;
  minimumSubtotal?: number | null;
  startsOn?: string;
  endsOn?: string;
  isActive: boolean;
}

function initialValues(code: DiscountCode | null): Partial<FormValues> {
  if (!code) return { kind: "Percentage", isActive: true };
  return {
    code: code.code,
    description: code.description ?? undefined,
    kind: code.kind,
    value: code.value,
    minimumSubtotal: code.minimumSubtotal,
    startsOn: isoToDateInput(code.startsAt),
    endsOn: isoToDateInput(code.endsAt),
    isActive: code.isActive,
  };
}

/** One sentence describing what the code will do, built from the form as typed. */
function summarize(values: Partial<FormValues>): string | null {
  if (!values.kind || !values.value) return null;
  let text = `Customers get ${describeDiscount(values.kind, values.value)}`;
  text += values.minimumSubtotal ? ` orders of ${formatMoney(values.minimumSubtotal)} or more` : " their order";
  if (values.startsOn) text += `, starting ${formatDate(`${values.startsOn}T00:00:00`)}`;
  if (values.endsOn) text += `${values.startsOn ? " and" : ","} ending ${formatDate(`${values.endsOn}T00:00:00`)}`;
  text += ".";
  if (!values.isActive) text += " It's switched off, so no one can use it yet.";
  return text;
}

interface DiscountCodeFormModalProps {
  /** The code to edit, or null to create one. */
  code: DiscountCode | null;
  onClose: () => void;
  onSaved: (code: DiscountCode, created: boolean) => void;
}

/** Create or edit a discount code. Mounted only while open. */
export default function DiscountCodeFormModal({ code, onClose, onSaved }: DiscountCodeFormModalProps) {
  const { token } = useAuth();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watched = Form.useWatch([], form) as Partial<FormValues> | undefined;
  const kind = watched?.kind ?? code?.kind ?? "Percentage";
  const summary = watched ? summarize(watched) : null;
  const isNew = code === null;

  async function handleSubmit(values: FormValues) {
    if (!token) return;
    const input: DiscountCodeInput = {
      code: values.code.trim().toUpperCase(),
      description: values.description?.trim() || null,
      kind: values.kind,
      value: values.value!,
      minimumSubtotal: values.minimumSubtotal ?? null,
      startsAt: dateInputToStartIso(values.startsOn),
      endsAt: dateInputToEndIso(values.endsOn),
      isActive: values.isActive,
    };

    setError(null);
    setSaving(true);
    try {
      const saved = isNew ? await createDiscountCode(token, input) : await updateDiscountCode(token, code.id, input);
      onSaved(saved, isNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The discount code couldn't be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={isNew ? "New discount code" : `Edit ${code.code}`}
      onCancel={onClose}
      width={600}
      okText={isNew ? "Create code" : "Save changes"}
      okButtonProps={{ loading: saving, htmlType: "submit", form: "discount-code-form" }}
      cancelButtonProps={{ disabled: saving }}
      mask={{ closable: !saving }}
    >
      <Form<FormValues>
        id="discount-code-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues(code)}
        onFinish={handleSubmit}
        disabled={saving}
        className="pt-2"
      >
        {error && <Alert type="error" showIcon title={error} className="mb-4" />}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            label="Code"
            name="code"
            extra="What customers type at checkout. Not case-sensitive."
            normalize={(value: string) => value.toUpperCase().replace(/\s/g, "")}
            rules={[
              { required: true, message: "Enter the code." },
              { max: 32, message: "At most 32 characters." },
              { pattern: /^[A-Za-z0-9_-]+$/, message: "Letters, numbers, hyphens, and underscores only." },
            ]}
          >
            <Input placeholder="SPRING15" autoFocus className="font-mono" />
          </Form.Item>

          <Form.Item label="Description" name="description" rules={[{ max: 200, message: "At most 200 characters." }]}>
            <Input placeholder="15% off for spring" />
          </Form.Item>
        </div>

        <Form.Item label="Discount type" name="kind">
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: "Percentage", label: "Percent off" },
              { value: "FixedAmount", label: "Dollar amount off" },
            ]}
            onChange={() => form.validateFields(["value"]).catch(() => {})}
          />
        </Form.Item>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            label={kind === "Percentage" ? "Percent off" : "Amount off"}
            name="value"
            dependencies={["kind"]}
            rules={[
              { required: true, message: "Enter the discount." },
              ({ getFieldValue }) => ({
                validator(_, value: number | undefined) {
                  if (value == null) return Promise.resolve();
                  if (value <= 0) return Promise.reject(new Error("Must be more than zero."));
                  if (getFieldValue("kind") === "Percentage" && value > 100) {
                    return Promise.reject(new Error("A percentage can't be more than 100."));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            {kind === "Percentage" ? (
              <InputNumber suffix="%" min={0} max={100} precision={2} className="w-full" />
            ) : (
              <InputNumber prefix="$" min={0} max={MAX_AMOUNT} precision={2} className="w-full" />
            )}
          </Form.Item>

          <Form.Item
            label="Minimum order"
            name="minimumSubtotal"
            extra="Optional. Subtotal before the discount."
          >
            <InputNumber prefix="$" min={0} max={MAX_AMOUNT} precision={2} placeholder="No minimum" className="w-full" />
          </Form.Item>
        </div>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item label="Starts" name="startsOn" extra="Optional. Blank means it works right away.">
            <Input type="date" />
          </Form.Item>
          <Form.Item
            label="Ends"
            name="endsOn"
            dependencies={["startsOn"]}
            extra="Optional. Blank means it never expires."
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value: string | undefined) {
                  const start = getFieldValue("startsOn") as string | undefined;
                  return !value || !start || value >= start
                    ? Promise.resolve()
                    : Promise.reject(new Error("The end date can't be before the start date."));
                },
              }),
            ]}
          >
            <Input type="date" />
          </Form.Item>
        </div>

        <Form.Item
          label="Active"
          name="isActive"
          valuePropName="checked"
          extra="Switch off to stop the code working without deleting it."
        >
          <Switch />
        </Form.Item>

        {summary && (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">{summary}</p>
        )}
      </Form>
    </Modal>
  );
}
