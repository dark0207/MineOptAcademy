import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ModuleForm } from "@/components/admin/ModuleForm";

export const metadata: Metadata = { title: "New module" };

export default async function NewModule() {
  await requireAdmin();
  const count = await db.module.count();

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>New module</h1>
          <p>A module is an area of MineOpt, such as PitOpt or SchedOpt.</p>
        </div>
      </div>
      <ModuleForm initial={{ name: "", slug: "", tagline: "", description: "", icon: "layers", accent: "#f5a524", sortOrder: count }} />
    </>
  );
}
