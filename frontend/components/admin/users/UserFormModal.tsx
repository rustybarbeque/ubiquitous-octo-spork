"use client";

import { useState } from "react";
import { Alert, Form, Input, Modal, Radio } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import { AdminUserInput, updateUser } from "@/lib/services/admin-service";
import { User, UserRole } from "@/lib/types";

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface UserFormModalProps {
  user: User;
  onClose: () => void;
  onSaved: (user: User) => void;
}

/** Edit any account's name, email, and role. Mounted only while open. */
export default function UserFormModal({ user, onClose, onSaved }: UserFormModalProps) {
  const { token, user: me, setUser } = useAuth();
  const [form] = Form.useForm<FormValues>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelf = me?.id === user.id;
  const role = Form.useWatch("role", form) ?? user.role;
  const promoting = user.role === "Customer" && role === "Admin";
  const demoting = user.role === "Admin" && role === "Customer";

  async function handleSubmit(values: FormValues) {
    if (!token) return;
    const input: AdminUserInput = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      // Your own role is locked so an admin can't lock themselves out.
      role: isSelf ? user.role : values.role,
    };

    setError(null);
    setSaving(true);
    try {
      const saved = await updateUser(token, user.id, input);
      if (isSelf) setUser(saved);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The account couldn't be saved.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={`Edit ${user.fullName}`}
      onCancel={onClose}
      okText="Save changes"
      okButtonProps={{ loading: saving, htmlType: "submit", form: "user-form" }}
      cancelButtonProps={{ disabled: saving }}
      mask={{ closable: !saving }}
    >
      <Form<FormValues>
        id="user-form"
        form={form}
        layout="vertical"
        requiredMark={false}
        initialValues={{ firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role }}
        onFinish={handleSubmit}
        disabled={saving}
        className="pt-2"
      >
        {error && <Alert type="error" showIcon title={error} className="mb-4" />}

        <div className="grid gap-x-4 sm:grid-cols-2">
          <Form.Item
            label="First name"
            name="firstName"
            rules={[
              { required: true, whitespace: true, message: "Enter a first name." },
              { max: 100, message: "At most 100 characters." },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            label="Last name"
            name="lastName"
            rules={[
              { required: true, whitespace: true, message: "Enter a last name." },
              { max: 100, message: "At most 100 characters." },
            ]}
          >
            <Input />
          </Form.Item>
        </div>

        <Form.Item
          label="Email"
          name="email"
          extra="The address they sign in with."
          rules={[
            { required: true, message: "Enter an email." },
            { type: "email", message: "That doesn't look like an email address." },
            { max: 256, message: "At most 256 characters." },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Role"
          name="role"
          extra={isSelf ? "You can't change your own role, so you can't lock yourself out of admin." : undefined}
        >
          <Radio.Group
            disabled={isSelf || saving}
            optionType="button"
            buttonStyle="solid"
            options={[
              { value: "Customer", label: "Customer" },
              { value: "Admin", label: "Administrator" },
            ]}
          />
        </Form.Item>

        {promoting && (
          <Alert
            type="info"
            showIcon
            title="This gives full access to the admin back end."
            description="They'll need to sign out and back in before the admin tools work for them."
          />
        )}
        {demoting && (
          <Alert
            type="warning"
            showIcon
            title="This removes their admin access."
            description="It takes full effect the next time they sign in."
          />
        )}
      </Form>
    </Modal>
  );
}
