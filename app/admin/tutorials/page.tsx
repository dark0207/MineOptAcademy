import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { LEVEL_LABEL, type Level } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { deleteTutorialAction, togglePublishedAction } from "@/app/actions/admin";
import { ConfirmForm } from "@/components/ConfirmForm";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Tutorials" };

type SearchParams = { q?: string; module?: string; status?: string };

export default async function AdminTutorials({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();
  const { q, module, status } = await searchParams;

  const [modules, tutorials] = await Promise.all([
    db.module.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } }),
    db.tutorial.findMany({
      where: {
        ...(q ? { OR: [{ title: { contains: q } }, { summary: { contains: q } }] } : {}),
        ...(module ? { module: { slug: module } } : {}),
        ...(status === "published" ? { published: true } : status === "draft" ? { published: false } : {}),
        ...(status === "novideo" ? { videoSource: "NONE" } : {}),
      },
      orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }, { title: "asc" }],
      include: { module: { select: { name: true, accent: true } } },
    }),
  ]);

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Tutorials</h1>
          <p>One tutorial per feature: description, steps and video.</p>
        </div>
        <Link href="/admin/tutorials/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> New tutorial
        </Link>
      </div>

      <form className="filter-bar" action="/admin/tutorials">
        <div className="search">
          <Icon name="search" size={16} />
          <input type="search" name="q" defaultValue={q ?? ""} placeholder="Search tutorials" aria-label="Search tutorials" />
        </div>
        <select name="module" defaultValue={module ?? ""} aria-label="Module">
          <option value="">All modules</option>
          {modules.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} aria-label="Status">
          <option value="">Any status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="novideo">No video</option>
        </select>
        <button type="submit" className="btn">
          Filter
        </button>
        {(q || module || status) && (
          <Link href="/admin/tutorials" className="btn btn-ghost">
            Clear
          </Link>
        )}
      </form>

      <div className="card table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Tutorial</th>
              <th>Module</th>
              <th>Video</th>
              <th>Level</th>
              <th>Views</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tutorials.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: "center", padding: 40 }}>
                  No tutorials match.
                </td>
              </tr>
            )}
            {tutorials.map((t) => {
              const hasVideo = (t.videoSource === "UPLOAD" && !!t.videoFile) || (t.videoSource === "EXTERNAL" && !!t.videoUrl);
              return (
                <tr key={t.id}>
                  <td className="title-cell">
                    <Link href={`/admin/tutorials/${t.id}`}>
                      <strong>{t.title}</strong>
                    </Link>
                    <span>
                      /{t.slug}
                      {t.durationMinutes > 0 && ` · ${formatDuration(t.durationMinutes)}`}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ color: t.module.accent }}>
                      {t.module.name}
                    </span>
                  </td>
                  <td>
                    {hasVideo ? (
                      <span className="badge badge-success">
                        <Icon name="check" size={12} /> {t.videoSource === "UPLOAD" ? "Uploaded" : "Linked"}
                      </span>
                    ) : (
                      <span className="badge badge-danger">Missing</span>
                    )}
                  </td>
                  <td className="muted">{LEVEL_LABEL[t.level as Level]}</td>
                  <td className="muted">{t.viewCount}</td>
                  <td>
                    <span className={`badge ${t.published ? "badge-success" : ""}`}>{t.published ? "Published" : "Draft"}</span>
                  </td>
                  <td className="actions">
                    <form action={togglePublishedAction} className="inline-form">
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="btn btn-sm btn-ghost" title={t.published ? "Unpublish" : "Publish"}>
                        <Icon name={t.published ? "eye-off" : "eye"} size={15} />
                      </button>
                    </form>
                    <Link href={`/library/${t.slug}`} className="btn btn-sm btn-ghost" title="View as learner">
                      <Icon name="external" size={15} />
                    </Link>
                    <Link href={`/admin/tutorials/${t.id}`} className="btn btn-sm">
                      <Icon name="edit" size={14} /> Edit
                    </Link>
                    <ConfirmForm action={deleteTutorialAction} message={`Delete “${t.title}” and its video? This can not be undone.`}>
                      <input type="hidden" name="id" value={t.id} />
                      <button type="submit" className="btn btn-sm btn-danger" title="Delete">
                        <Icon name="trash" size={14} />
                      </button>
                    </ConfirmForm>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
