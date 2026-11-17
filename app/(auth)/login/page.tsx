import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser, safeNext } from "@/lib/auth";
import { LoginForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Admin sign in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user?.role === "ADMIN") redirect(next ? safeNext(next) : "/admin");
  if (user) redirect("/library");

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1>Administrator sign in</h1>
        <p className="sub">Sign in to manage tutorials, modules and media. The tutorial library is open to everyone without an account.</p>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
