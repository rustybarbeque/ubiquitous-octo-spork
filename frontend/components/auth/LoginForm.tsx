"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input } from "antd";
import { useAuth } from "./AuthProvider";

interface LoginValues {
  email: string;
  password: string;
}

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { status, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in (e.g. the user came back with the browser's Back button).
  useEffect(() => {
    if (status === "signed-in") router.replace(redirectTo);
  }, [status, redirectTo, router]);

  async function handleSubmit(values: LoginValues) {
    setError(null);
    setSubmitting(true);
    try {
      await login(values.email.trim(), values.password);
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitting(false);
    }
  }

  return (
    <Form<LoginValues> layout="vertical" requiredMark={false} onFinish={handleSubmit} disabled={submitting}>
      {error && <Alert type="error" title={error} showIcon className="mb-4" />}

      <Form.Item
        label="Email"
        name="email"
        rules={[
          { required: true, message: "Enter your email." },
          { type: "email", message: "That doesn't look like an email address." },
        ]}
      >
        <Input autoComplete="email" autoFocus />
      </Form.Item>

      <Form.Item label="Password" name="password" rules={[{ required: true, message: "Enter your password." }]}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>

      <Button type="primary" htmlType="submit" block loading={submitting}>
        Sign in
      </Button>
    </Form>
  );
}
