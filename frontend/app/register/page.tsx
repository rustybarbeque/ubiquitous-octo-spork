import type { Metadata } from "next";
import Link from "next/link";
import AuthCard from "@/components/auth/AuthCard";
import RegisterForm from "@/components/auth/RegisterForm";
import { safeRedirectPath } from "@/lib/auth/redirect";

export const metadata: Metadata = { title: "Create account | Macrocenter" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  const redirectTo = safeRedirectPath(next);
  const loginHref = redirectTo === "/" ? "/login" : `/login?next=${encodeURIComponent(redirectTo)}`;

  return (
    <AuthCard
      title="Create your account"
      subtitle="Sign up to build a cart and place orders."
      footer={
        <>
          Already have an account?{" "}
          <Link href={loginHref} className="font-medium text-zinc-900 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm redirectTo={redirectTo} />
    </AuthCard>
  );
}
