"use client";

import { useState } from "react";
import { Alert, App, Button, Form, Input } from "antd";
import { useAuth } from "@/components/auth/AuthProvider";
import { updateMyProfile } from "@/lib/services/user-service";
import { User } from "@/lib/types";

interface ProfileValues {
  firstName: string;
  lastName: string;
  email: string;
}

function valuesFrom(user: User): ProfileValues {
  return { firstName: user.firstName, lastName: user.lastName, email: user.email };
}

function sameValues(a: ProfileValues, b: ProfileValues) {
  return (
    a.firstName.trim() === b.firstName &&
    a.lastName.trim() === b.lastName &&
    a.email.trim().toLowerCase() === b.email
  );
}

/** Edits the signed-in user's name and email. Only rendered inside <RequireAuth>. */
export default function AccountSettingsForm({ user, token }: { user: User; token: string }) {
  const { message } = App.useApp();
  const { setUser } = useAuth();
  const [form] = Form.useForm<ProfileValues>();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const saved = valuesFrom(user);

  async function handleSubmit(values: ProfileValues) {
    setError(null);
    setSaving(true);
    try {
      const updated = await updateMyProfile(token, {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
      setUser(updated);
      form.setFieldsValue(valuesFrom(updated));
      setDirty(false);
      message.success("Your account details have been saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    form.setFieldsValue(saved);
    setDirty(false);
    setError(null);
  }

  return (
    <Form<ProfileValues>
      form={form}
      layout="vertical"
      requiredMark={false}
      initialValues={saved}
      onFinish={handleSubmit}
      onValuesChange={(_, all) => setDirty(!sameValues(all, saved))}
      disabled={saving}
    >
      {error && <Alert type="error" title={error} showIcon className="mb-4" />}

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Form.Item
          label="First name"
          name="firstName"
          rules={[
            { required: true, whitespace: true, message: "Enter your first name." },
            { max: 100, message: "At most 100 characters." },
          ]}
        >
          <Input autoComplete="given-name" />
        </Form.Item>

        <Form.Item
          label="Last name"
          name="lastName"
          rules={[
            { required: true, whitespace: true, message: "Enter your last name." },
            { max: 100, message: "At most 100 characters." },
          ]}
        >
          <Input autoComplete="family-name" />
        </Form.Item>
      </div>

      <Form.Item
        label="Email"
        name="email"
        extra="You'll use this to sign in."
        rules={[
          { required: true, message: "Enter your email." },
          { type: "email", message: "That doesn't look like an email address." },
          { max: 256, message: "At most 256 characters." },
        ]}
      >
        <Input autoComplete="email" />
      </Form.Item>

      <div className="flex justify-end gap-2">
        <Button onClick={handleReset} disabled={!dirty || saving}>
          Discard changes
        </Button>
        <Button type="primary" htmlType="submit" loading={saving} disabled={!dirty}>
          Save changes
        </Button>
      </div>
    </Form>
  );
}
