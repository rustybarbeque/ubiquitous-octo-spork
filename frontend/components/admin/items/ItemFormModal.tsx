"use client";

import { useState } from "react";
import { Alert, AutoComplete, Button, Form, Input, InputNumber, Modal, Space, Switch } from "antd";
import { Wand2 } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useAuth } from "@/components/auth/AuthProvider";
import { createItem, ItemInput, updateItem } from "@/lib/services/admin-service";
import { placeholderImageUrl } from "@/lib/placeholder-image";
import { Item } from "@/lib/types";

/** The API's upper bound on any price (numeric(10,2)). */
const MAX_PRICE = 99_999_999.99;

interface ItemFormValues {
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  price: number;
  onSale: boolean;
  salePrice?: number | null;
  quantityAvailable: number;
}

interface ItemFormModalProps {
  /** The item to edit, or null to create a new one. */
  item: Item | null;
  categories: string[];
  onClose: () => void;
  onSaved: (item: Item, created: boolean) => void;
}

function initialValues(item: Item | null): Partial<ItemFormValues> {
  if (!item) return { onSale: false, quantityAvailable: 0, imageUrl: "" };
  return {
    name: item.name,
    category: item.category,
    description: item.description,
    imageUrl: item.imageUrl,
    price: item.price,
    onSale: item.salePrice !== null,
    salePrice: item.salePrice,
    quantityAvailable: item.quantityAvailable,
  };
}

/** Create or fully edit a product. Mounted only while open, so each opening starts fresh. */
export default function ItemFormModal({ item, categories, onClose, onSaved }: ItemFormModalProps) {
  const { token } = useAuth();
  const [form] = Form.useForm<ItemFormValues>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);

  const imageUrl = (Form.useWatch("imageUrl", form) ?? "").trim();
  const onSale = Form.useWatch("onSale", form) ?? false;
  const isNew = item === null;

  function generatePlaceholder() {
    const { name = "", category = "" } = form.getFieldsValue(["name", "category"]);
    form.setFieldValue("imageUrl", placeholderImageUrl(name, category.trim()));
    form.validateFields(["imageUrl"]).catch(() => {});
  }

  async function handleSubmit(values: ItemFormValues) {
    if (!token) return;
    const input: ItemInput = {
      name: values.name.trim(),
      category: values.category.trim(),
      description: values.description.trim(),
      imageUrl: values.imageUrl.trim(),
      price: values.price,
      salePrice: values.onSale ? (values.salePrice ?? null) : null,
      quantityAvailable: values.quantityAvailable,
    };

    setError(null);
    setSaving(true);
    try {
      const saved = isNew ? await createItem(token, input) : await updateItem(token, item.id, input);
      onSaved(saved, isNew);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The item couldn't be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={isNew ? "New item" : `Edit ${item.name}`}
      onCancel={onClose}
      width={720}
      okText={isNew ? "Create item" : "Save changes"}
      okButtonProps={{ loading: saving, htmlType: "submit", form: "item-form" }}
      cancelButtonProps={{ disabled: saving }}
      mask={{ closable: !saving }}
    >
      <Form<ItemFormValues>
        id="item-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={initialValues(item)}
        onFinish={handleSubmit}
        disabled={saving}
        className="pt-2"
      >
        {error && <Alert type="error" showIcon title={error} className="mb-4" />}

        <div className="grid gap-x-6 md:grid-cols-[1fr_200px]">
          <div>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, whitespace: true, message: "Give the item a name." },
                { max: 200, message: "At most 200 characters." },
              ]}
            >
              <Input autoFocus />
            </Form.Item>

            <Form.Item
              label="Category"
              name="category"
              extra="Pick an existing category or type a new one."
              rules={[
                { required: true, whitespace: true, message: "Choose a category." },
                { max: 100, message: "At most 100 characters." },
              ]}
            >
              <AutoComplete
                options={categories.map((value) => ({ value }))}
                filterOption={(input, option) => (option?.value ?? "").toLowerCase().includes(input.toLowerCase())}
              />
            </Form.Item>
          </div>

          <Form.Item label="Preview">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
              <ProductImage
                key={imageUrl}
                src={imageUrl}
                alt="Item image preview"
                sizes="200px"
                onLoadError={() => setBrokenUrl(imageUrl)}
              />
            </div>
          </Form.Item>
        </div>

        <Form.Item
          label="Image URL"
          required
          extra={
            imageUrl && brokenUrl === imageUrl ? (
              <span className="text-amber-600">
                This image couldn&apos;t be loaded. Customers would see the placeholder instead.
              </span>
            ) : (
              "Paste a link to an image from any site, or generate a placeholder."
            )
          }
        >
          <Space.Compact className="w-full">
            <Form.Item
              name="imageUrl"
              noStyle
              rules={[
                { required: true, whitespace: true, message: "Add an image URL." },
                { type: "url", message: "Enter a full URL, starting with https://" },
                { max: 500, message: "At most 500 characters." },
              ]}
            >
              <Input placeholder="https://…" />
            </Form.Item>
            <Button icon={<Wand2 className="h-3.5 w-3.5" />} onClick={generatePlaceholder}>
              Generate placeholder
            </Button>
          </Space.Compact>
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[
            { required: true, whitespace: true, message: "Describe the item." },
            { max: 2000, message: "At most 2000 characters." },
          ]}
        >
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 6 }} showCount maxLength={2000} />
        </Form.Item>

        <div className="grid gap-x-6 sm:grid-cols-3">
          <Form.Item label="Price" name="price" rules={[{ required: true, message: "Set a price." }]}>
            <InputNumber prefix="$" min={0} max={MAX_PRICE} precision={2} step={1} className="w-full" />
          </Form.Item>

          <Form.Item
            label="Quantity available"
            name="quantityAvailable"
            rules={[{ required: true, message: "Set the stock." }]}
          >
            <InputNumber min={0} precision={0} className="w-full" />
          </Form.Item>

          <Form.Item label="On sale" name="onSale" valuePropName="checked">
            <Switch />
          </Form.Item>
        </div>

        {onSale && (
          <Form.Item
            label="Sale price"
            name="salePrice"
            dependencies={["price"]}
            extra="Shown with a Sale badge in the store, and charged in every cart that holds this item."
            rules={[
              { required: true, message: "Set the sale price." },
              ({ getFieldValue }) => ({
                validator(_, value: number | null | undefined) {
                  const price = getFieldValue("price") as number | undefined;
                  if (value == null || price == null || value < price) return Promise.resolve();
                  return Promise.reject(new Error("The sale price must be lower than the regular price."));
                },
              }),
            ]}
          >
            <InputNumber prefix="$" min={0} max={MAX_PRICE} precision={2} step={1} className="w-full sm:w-1/3" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
