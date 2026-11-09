import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import LoginForm from "@/components/auth/LoginForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Sign in | Macrocenter" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(next);
  const registerHref = redirectTo === "/" ? "/register" : `/register?next=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthCard
      title="Sign in"
      subtitle="Welcome back to Macrocenter."
      footer={
        <>
          New here?{" "}
          <Link href={registerHref} className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
