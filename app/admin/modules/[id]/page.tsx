import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { deleteModuleAction } from "@/app/actions/admin";
import { ConfirmForm } from "@/components/ConfirmForm";
import { Icon } from "@/components/Icon";
import { ModuleForm } from "@/components/admin/ModuleForm";

export const metadata: Metadata = { title: "Edit module" };

export default async function EditModule({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const found = await db.module.findUnique({ where: { id }, include: { _count: { select: { tutorials: true } } } });
  if (!found) notFound();

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>{found.name}</h1>
          <p>{found._count.tutorials} tutorials in this module.</p>
        </div>
      </div>

      {error === "has-tutorials" && (
        <div className="alert alert-error" role="alert">
          This module still has tutorials. Move or delete them first, then delete the module.
        </div>
      )}

      <ModuleForm
        initial={{
          id: found.id,
          name: found.name,
          slug: found.slug,
          tagline: found.tagline,
          description: found.description,
          icon: found.icon,
          accent: found.accent,
          sortOrder: found.sortOrder,
        }}
      />

      <section className="card card-pad" style={{ maxWidth: 760, marginTop: 22 }}>
        <h2 className="card-title">Delete module</h2>
        <p className="muted" style={{ marginBottom: 14 }}>
          Only empty modules can be deleted, so tutorials and their videos are never removed by accident.
        </p>
        <ConfirmForm action={deleteModuleAction} message={`Delete the module “${found.name}”?`}>
          <input type="hidden" name="id" value={found.id} />
          <button type="submit" className="btn btn-danger" disabled={found._count.tutorials > 0}>
            <Icon name="trash" size={15} /> Delete module
          </button>
        </ConfirmForm>
      </section>
    </>
  );
}
