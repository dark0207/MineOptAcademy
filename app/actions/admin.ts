"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { deleteMedia } from "@/lib/storage";
import { slugify, uniqueSlug } from "@/lib/slug";
import { ROLES, type Role } from "@/lib/constants";
import { createUserSchema, fieldErrorsOf, formValues, moduleSchema, tutorialSchema, type FormState } from "@/lib/validation";

const refresh = () => revalidatePath("/", "layout");

// ---------------------------------------------------------------- tutorials

export async function saveTutorialAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const values = formValues(form);
  const id = values.id || null;

  const parsed = tutorialSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Some fields need attention.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const input = parsed.data;

  if (!(await db.module.findUnique({ where: { id: input.moduleId }, select: { id: true } }))) {
    return { fieldErrors: { moduleId: "That module no longer exists." }, values };
  }

  const slug = await uniqueSlug(slugify(input.slug || input.title), async (candidate) => {
    const found = await db.tutorial.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!found && found.id !== id;
  });

  const data = {
    moduleId: input.moduleId,
    slug,
    title: input.title,
    summary: input.summary,
    description: input.description,
    steps: input.steps,
    videoSource: input.videoSource,
    videoUrl: input.videoSource === "EXTERNAL" ? input.videoUrl : null,
    durationMinutes: input.durationMinutes,
    level: input.level,
    sortOrder: input.sortOrder,
    published: input.published,
    featured: input.featured,
  };

  if (!id) {
    const created = await db.tutorial.create({ data });
    refresh();
    redirect(`/admin/tutorials/${created.id}?created=1`);
  }

  const existing = await db.tutorial.findUnique({ where: { id }, select: { videoFile: true } });
  if (!existing) {
    return { error: "This tutorial was deleted by someone else.", values };
  }

  // an uploaded file is only kept while the tutorial still uses it
  const dropUpload = input.videoSource !== "UPLOAD" && !!existing.videoFile;
  await db.tutorial.update({ where: { id }, data: { ...data, ...(dropUpload ? { videoFile: null } : {}) } });
  if (dropUpload) await deleteMedia("video", existing.videoFile);

  refresh();
  return { ok: true, savedAt: Date.now(), values };
}

export async function deleteTutorialAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");

  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { videoFile: true, thumbnailFile: true } });
  if (tutorial) {
    await db.tutorial.delete({ where: { id } });
    await deleteMedia("video", tutorial.videoFile);
    await deleteMedia("thumbnail", tutorial.thumbnailFile);
  }
  refresh();
  redirect("/admin/tutorials");
}

export async function togglePublishedAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");
  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { published: true } });
  if (tutorial) {
    await db.tutorial.update({ where: { id }, data: { published: !tutorial.published } });
  }
  refresh();
}

// ------------------------------------------------------------------ modules

export async function saveModuleAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const values = formValues(form);
  const id = values.id || null;

  const parsed = moduleSchema.safeParse(values);
  if (!parsed.success) {
    return { error: "Some fields need attention.", fieldErrors: fieldErrorsOf(parsed.error), values };
  }
  const input = parsed.data;

  const slug = await uniqueSlug(slugify(input.slug || input.name), async (candidate) => {
    const found = await db.module.findUnique({ where: { slug: candidate }, select: { id: true } });
    return !!found && found.id !== id;
  });
  const data = { ...input, slug };

  if (!id) {
    await db.module.create({ data });
    refresh();
    redirect("/admin/modules?saved=1");
  }

  await db.module.update({ where: { id }, data });
  refresh();
  return { ok: true, values };
}

export async function deleteModuleAction(form: FormData) {
  await requireAdmin();
  const id = String(form.get("id") ?? "");

  // tutorials (and their videos) are never deleted as a side effect
  const count = await db.tutorial.count({ where: { moduleId: id } });
  if (count > 0) {
    redirect(`/admin/modules/${id}?error=has-tutorials`);
  }
  await db.module.deleteMany({ where: { id } });
  refresh();
  redirect("/admin/modules");
}

// -------------------------------------------------------------------- users

export async function createUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();

  const values = formValues(form);
  const keep = { name: values.name ?? "", email: values.email ?? "", role: values.role ?? "USER" };

  const parsed = createUserSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsOf(parsed.error), values: keep };
  }
  const { name, email, password, role } = parsed.data;

  if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
    return { fieldErrors: { email: "An account with this email already exists." }, values: keep };
  }

  await db.user.create({ data: { name, email, role, passwordHash: await hashPassword(password) } });
  revalidatePath("/admin/users");
  return { ok: true, savedAt: Date.now() };
}

async function adminCount() {
  return db.user.count({ where: { role: "ADMIN", active: true } });
}

export async function setUserRoleAction(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const role = String(form.get("role") ?? "") as Role;

  if (!ROLES.includes(role) || id === admin.id) return; // never change your own role

  const target = await db.user.findUnique({ where: { id }, select: { role: true, active: true } });
  if (!target) return;
  if (target.role === "ADMIN" && target.active && role !== "ADMIN" && (await adminCount()) <= 1) return;

  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function setUserActiveAction(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const active = form.get("active") === "true";

  if (id === admin.id) return; // never disable yourself

  const target = await db.user.findUnique({ where: { id }, select: { role: true, active: true } });
  if (!target) return;
  if (!active && target.role === "ADMIN" && target.active && (await adminCount()) <= 1) return;

  await db.user.update({ where: { id }, data: { active } });
  revalidatePath("/admin/users");
}
