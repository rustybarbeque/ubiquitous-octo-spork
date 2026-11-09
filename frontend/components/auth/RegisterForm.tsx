"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, Form, Input } from "antd";
import { useAuth } from "./AuthProvider";

interface RegisterValues {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { status, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "signed-in") router.replace(redirectTo);
  }, [status, redirectTo, router]);

  async function handleSubmit(values: RegisterValues) {
    setError(null);
    setSubmitting(true);
    try {
      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        password: values.password,
      });
      router.replace(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setSubmitting(false);
    }
  }

  return (
    <Form<RegisterValues> layout="vertical" requiredMark={false} onFinish={handleSubmit} disabled={submitting}>
      {error && <Alert type="error" title={error} showIcon className="mb-4" />}

      <div className="grid grid-cols-2 gap-3">
        <Form.Item
          label="First name"
          name="firstName"
          rules={[
            { required: true, whitespace: true, message: "Enter your first name." },
            { max: 100, message: "At most 100 characters." },
          ]}
        >
          <Input autoComplete="given-name" autoFocus />
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
        rules={[
          { required: true, message: "Enter your email." },
          { type: "email", message: "That doesn't look like an email address." },
          { max: 256, message: "At most 256 characters." },
        ]}
      >
        <Input autoComplete="email" />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          { required: true, message: "Choose a password." },
          { min: 6, message: "At least 6 characters." },
          { max: 128, message: "At most 128 characters." },
        ]}
        hasFeedback
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Form.Item
        label="Confirm password"
        name="confirmPassword"
        dependencies={["password"]}
        hasFeedback
        rules={[
          { required: true, message: "Re-enter your password." },
          ({ getFieldValue }) => ({
            validator(_, value) {
              return !value || getFieldValue("password") === value
                ? Promise.resolve()
                : Promise.reject(new Error("The passwords don't match."));
            },
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>

      <Button type="primary" htmlType="submit" block loading={submitting}>
        Create account
      </Button>
    </Form>
  );
}
