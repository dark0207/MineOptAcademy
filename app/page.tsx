import type { CSSProperties } from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { formatDuration } from "@/lib/format";
import { getFeatured, getModulesWithStats, getSiteStats } from "@/lib/queries";
import { Icon } from "@/components/Icon";
import { TutorialCard } from "@/components/TutorialCard";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const [{ denied }, user, modules, stats, featured] = await Promise.all([
    searchParams,
    getCurrentUser(),
    getModulesWithStats(),
    getSiteStats(),
    getFeatured(6),
  ]);
  const isAdmin = user?.role === "ADMIN";

  return (
    <>
      <section className="hero">
        <div className="container">
          {denied && <div className="alert alert-error" style={{ maxWidth: 520 }}>That area is for administrators only.</div>}
          <span className="eyebrow">
            <Icon name="play" size={14} /> Video tutorials for every MineOpt feature
          </span>
          <h1>
            Master mine planning, <em>one feature at a time.</em>
          </h1>
          <p className="lead">
            Short, focused videos with a clear written guide for each feature of PitOpt, AutoDesign and SchedOpt. Browse freely — no account needed.
          </p>
          <div className="actions">
            <Link href="/library" className="btn btn-primary btn-lg">
              Browse tutorials <Icon name="arrow-right" size={18} />
            </Link>
            {isAdmin && (
              <Link href="/admin" className="btn btn-lg">
                Admin console
              </Link>
            )}
          </div>

          <div className="stats">
            <div className="stat"><strong>{stats.modules}</strong><span>Modules</span></div>
            <div className="stat"><strong>{stats.tutorials}</strong><span>Feature tutorials</span></div>
            <div className="stat"><strong>{stats.videos}</strong><span>Videos available</span></div>
            <div className="stat"><strong>{formatDuration(stats.minutes) || "0 min"}</strong><span>Of content</span></div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <h2>Choose what you want to learn</h2>
              <p>Tutorials are grouped by the part of MineOpt they belong to.</p>
            </div>
          </div>
          <div className="module-grid">
            {modules.map((module) => (
              <Link key={module.id} href={`/library?module=${module.slug}`} className="module-tile" style={{ "--accent-color": module.accent } as CSSProperties}>
                <span className="module-icon">
                  <Icon name={module.icon} size={24} />
                </span>
                <h3>{module.name}</h3>
                <p>{module.tagline}</p>
                <div className="meta">
                  <span>{module.tutorialCount} tutorials</span>
                  <span>{formatDuration(module.minutes)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <h2>Start here</h2>
                <p>Hand-picked tutorials to get productive quickly.</p>
              </div>
              <Link href="/library" className="btn btn-sm">
                View all <Icon name="arrow-right" size={14} />
              </Link>
            </div>
            <div className="card-grid">
              {featured.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
