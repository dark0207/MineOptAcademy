import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { Icon } from "@/components/Icon";

export default async function AdminDashboard() {
  const admin = await requireAdmin();

  const [published, drafts, withVideo, users, views, topTutorials, missingVideo, recentUsers, completions] = await Promise.all([
    db.tutorial.count({ where: { published: true } }),
    db.tutorial.count({ where: { published: false } }),
    db.tutorial.count({ where: { videoSource: { not: "NONE" } } }),
    db.user.count(),
    db.tutorial.aggregate({ _sum: { viewCount: true } }),
    db.tutorial.findMany({ orderBy: { viewCount: "desc" }, take: 5, include: { module: { select: { name: true } } } }),
    db.tutorial.findMany({
      where: { videoSource: "NONE", published: true },
      orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      take: 6,
      include: { module: { select: { name: true } } },
    }),
    db.user.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.progress.count(),
  ]);
  const total = published + drafts;
  const withoutVideo = await db.tutorial.count({ where: { videoSource: "NONE", published: true } });

  const kpis = [
    { label: "Tutorials", value: total, note: `${published} published · ${drafts} draft`, icon: "video" },
    { label: "With video", value: withVideo, note: `${total - withVideo} still need one`, icon: "film" },
    { label: "Learners", value: users, note: `${completions} completions`, icon: "users" },
    { label: "Total views", value: views._sum.viewCount ?? 0, note: "All tutorial page views", icon: "eye" },
  ];

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {admin.name}. Here is how the academy is doing.</p>
        </div>
        <Link href="/admin/tutorials/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> New tutorial
        </Link>
      </div>

      <div className="kpis">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="card kpi">
            <div className="top">
              {kpi.label}
              <span className="icon-box">
                <Icon name={kpi.icon} size={17} />
              </span>
            </div>
            <strong>{kpi.value.toLocaleString("en-US")}</strong>
            <small>{kpi.note}</small>
          </div>
        ))}
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-pad" style={{ paddingBottom: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              Most viewed
            </h2>
          </div>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {topTutorials.map((t) => (
                  <tr key={t.id}>
                    <td className="title-cell">
                      <Link href={`/admin/tutorials/${t.id}`}>
                        <strong>{t.title}</strong>
                      </Link>
                      <span>{t.module.name}</span>
                    </td>
                    <td className="actions">
                      <span className="badge">
                        <Icon name="eye" size={13} /> {t.viewCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <div className="card-pad row between" style={{ paddingBottom: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              Needs a video
            </h2>
            {withoutVideo > 0 && <span className="badge badge-accent">{withoutVideo} published</span>}
          </div>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {missingVideo.length === 0 && (
                  <tr>
                    <td className="muted">Every published tutorial has a video.</td>
                  </tr>
                )}
                {missingVideo.map((t) => (
                  <tr key={t.id}>
                    <td className="title-cell">
                      <strong>{t.title}</strong>
                      <span>{t.module.name}</span>
                    </td>
                    <td className="actions">
                      <Link href={`/admin/tutorials/${t.id}`} className="btn btn-sm">
                        <Icon name="upload" size={14} /> Add video
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card" style={{ gridColumn: "1 / -1" }}>
          <div className="card-pad row between" style={{ paddingBottom: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>
              Newest users
            </h2>
            <Link href="/admin/users" className="btn btn-sm">
              Manage users
            </Link>
          </div>
          <div className="table-wrap">
            <table className="data">
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="title-cell">
                      <strong>{u.name}</strong>
                      <span>{u.email}</span>
                    </td>
                    <td>
                      <span className={`badge ${u.role === "ADMIN" ? "badge-accent" : ""}`}>{u.role === "ADMIN" ? "Admin" : "Learner"}</span>
                    </td>
                    <td className="muted">Joined {formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
