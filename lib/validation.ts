import { z } from "zod";
import { LEVELS, VIDEO_SOURCES } from "./constants";
import { resolveEmbed } from "./video";

/** State returned by form server actions to `useActionState`. */
export type FormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  /** values to refill the form with after a failed submit */
  values?: Record<string, string>;
  ok?: boolean;
  /** changes on every successful save, so the UI can show a fresh confirmation each time */
  savedAt?: number;
};

/** first message per field, for display next to the inputs */
export function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** FormData to plain strings (checkboxes become "on" or are absent); files are ignored */
export function formValues(form: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) values[key] = value;
  }
  return values;
}

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

const text = (max: number) => z.string().trim().max(max, `Keep this under ${max} characters.`);

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name.").max(80),
    email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(128)
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "The passwords do not match." });

/** an account created by an administrator, who also chooses the role */
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address.")),
  password: z
    .string()
    .min(10, "Use at least 10 characters.")
    .max(128)
    .regex(/[A-Za-z]/, "Include at least one letter.")
    .regex(/[0-9]/, "Include at least one number."),
  role: z.enum(["USER", "ADMIN"]),
});

export const moduleSchema = z.object({
  name: z.string().trim().min(2, "Enter a name.").max(80),
  slug: text(80).optional().default(""),
  tagline: text(160).default(""),
  description: text(2000).default(""),
  icon: text(40).min(1).default("layers"),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
});

export const tutorialSchema = z
  .object({
    moduleId: z.string().min(1, "Choose a module."),
    title: z.string().trim().min(3, "Enter a title.").max(160),
    slug: text(120).optional().default(""),
    summary: text(400).default(""),
    description: z.string().max(20000, "Keep the description under 20,000 characters.").default(""),
    steps: z.string().max(20000, "Keep the steps under 20,000 characters.").default(""),
    videoSource: z.enum(VIDEO_SOURCES),
    videoUrl: text(500).optional().default(""),
    durationMinutes: z.coerce.number().int().min(0).max(600).default(0),
    level: z.enum(LEVELS),
    sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
    published: checkbox,
    featured: checkbox,
  })
  .superRefine((value, ctx) => {
    if (value.videoSource === "EXTERNAL" && resolveEmbed(value.videoUrl).kind === "none") {
      ctx.addIssue({
        code: "custom",
        path: ["videoUrl"],
        message: "Use a YouTube or Vimeo link, or a direct link to an .mp4 / .webm file.",
      });
    }
  });

export type TutorialInput = z.infer<typeof tutorialSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
