import Logo from "@/components/header/Logo";

interface AuthCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** The centered card shared by the sign-in and registration pages. */
export default function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 py-10">
      <Logo />

      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-zinc-900">{title}</h1>
        <p className="mb-6 mt-1 text-sm text-zinc-500">{subtitle}</p>
        {children}
      </div>

      <p className="text-sm text-zinc-500">{footer}</p>
    </main>
  );
}
