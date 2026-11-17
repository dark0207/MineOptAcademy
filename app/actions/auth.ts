"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, destroySession, hashPassword, safeNext, verifyPassword } from "@/lib/auth";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limit";
import { fieldErrorsOf, formValues, loginSchema, type FormState } from "@/lib/validation";

// compared against when the email is unknown so response time does not reveal which emails exist
const dummyHash = hashPassword(crypto.randomUUID());

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export async function loginAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = formValues(form);
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values: { email: values.email ?? "" } };
  }
  const { email, password } = parsed.data;

  const key = `login:${await clientKey()}:${email}`;
  const wait = checkRateLimit(key);
  if (wait > 0) {
    return { error: `Too many attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, values: { email } };
  }

  const user = await db.user.findUnique({ where: { email } });
  const valid = await verifyPassword(password, user?.passwordHash ?? (await dummyHash));
  if (!user || !valid || !user.active) {
    return {
      error: user && valid && !user.active ? "This account has been disabled. Contact an administrator." : "Incorrect email or password.",
      values: { email },
    };
  }

  if (user.role !== "ADMIN") {
    return { error: "Only administrators can sign in. Tutorials are available without an account.", values: { email } };
  }

  clearRateLimit(key);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await createSession(user.id);
  redirect(values.next ? safeNext(values.next) : "/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}
