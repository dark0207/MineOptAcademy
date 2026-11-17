import path from "node:path";

/** Settings read from the environment; see .env.example. */
export const config = {
  /** Tutorials are open to everyone; set PUBLIC_LIBRARY=false only if you need a private intranet. */
  publicLibrary: process.env.PUBLIC_LIBRARY !== "false",
  /** Learner self sign-up is off; administrators sign in at /login. */
  allowRegistration: process.env.ALLOW_REGISTRATION === "true",
  maxVideoBytes: (Number(process.env.MAX_VIDEO_MB) || 2048) * 1024 * 1024,
  maxThumbnailBytes: 5 * 1024 * 1024,
  storageDir: path.resolve(process.cwd(), process.env.STORAGE_DIR || "./storage"),
};

export function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters (see .env.example).");
  }
  return new TextEncoder().encode(secret);
}
