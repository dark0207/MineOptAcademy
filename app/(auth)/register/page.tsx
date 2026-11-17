import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Create account" };

/** Learner registration is disabled — tutorials are public. */
export default function RegisterPage() {
  redirect("/");
}
