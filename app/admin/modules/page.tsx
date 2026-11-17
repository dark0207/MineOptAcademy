import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Modules" };

export default async function AdminModules({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const modules = await db.module.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { tutorials: true } } },
  });

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Modules</h1>
          <p>Modules group tutorials on the home page and in the library.</p>
        </div>
        <Link href="/admin/modules/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> New module
        </Link>
      </div>

      {saved && <div className="alert alert-success">Module saved.</div>}

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Module</th>
              <th>Slug</th>
              <th>Tutorials</th>
              <th>Order</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="row" style={{ flexWrap: "nowrap" }}>
                    <span className="module-icon" style={{ "--accent-color": m.accent, width: 38, height: 38 } as CSSProperties}>
                      <Icon name={m.icon} size={18} />
                    </span>
                    <div className="title-cell">
                      <strong>{m.name}</strong>
                      <span>{m.tagline}</span>
                    </div>
                  </div>
                </td>
                <td className="muted">{m.slug}</td>
                <td>
                  <Link href={`/admin/tutorials?module=${m.slug}`} className="badge">
                    {m._count.tutorials}
                  </Link>
                </td>
                <td className="muted">{m.sortOrder}</td>
                <td className="actions">
                  <Link href={`/admin/modules/${m.id}`} className="btn btn-sm">
                    <Icon name="edit" size={14} /> Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
