import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { authSecret } from "./config";
import { db } from "./db";
import { SESSION_COOKIE, SESSION_DAYS, type Role } from "./constants";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export const hashPassword = (password: string) => bcrypt.hash(password, 12);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** Signs the user in by setting a signed, httpOnly session cookie. */
export async function createSession(userId: string) {
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(expires)
    .sign(authSecret());

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/**
 * The signed in user, or null. The role and active flag always come from the database,
 * so demoting or disabling a user takes effect immediately rather than when the cookie expires.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  let userId: string | undefined;
  try {
    const { payload } = await jwtVerify(token, authSecret(), { algorithms: ["HS256"] });
    userId = payload.sub;
  } catch {
    return null;
  }
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, active: true },
  });
  if (!user || !user.active) return null;

  return { id: user.id, email: user.email, name: user.name, role: user.role as Role };
});

/** For pages and actions that need a signed in user. */
export async function requireUser(returnTo?: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login");
  }
  return user;
}

/** For admin pages and actions. Call this in every admin action, not only the layout. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser("/admin");
  if (user.role !== "ADMIN") {
    redirect("/?denied=1");
  }
  return user;
}

/** Only allows redirects inside this site. */
export function safeNext(next: string | null | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    return next;
  }
  return "/library";
}
