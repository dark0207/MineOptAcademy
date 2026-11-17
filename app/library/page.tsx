import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS, LEVEL_LABEL, type Level } from "@/lib/constants";
import { getLibrary, getModulesWithStats } from "@/lib/queries";
import { Icon } from "@/components/Icon";
import { TutorialCard } from "@/components/TutorialCard";

export const metadata: Metadata = { title: "Tutorials" };

type SearchParams = { q?: string; module?: string; level?: string };

function buildHref(current: SearchParams, change: Partial<SearchParams>) {
  const params = new URLSearchParams();
  const merged = { ...current, ...change };
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/library?${query}` : "/library";
}

export default async function LibraryPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const level = LEVELS.includes(params.level as Level) ? (params.level as Level) : undefined;

  const [modules, tutorials] = await Promise.all([
    getModulesWithStats(),
    getLibrary({ q: params.q, module: params.module, level }),
  ]);

  const activeModule = modules.find((m) => m.slug === params.module);
  const current: SearchParams = { q: params.q, module: params.module, level };
  const total = modules.reduce((sum, m) => sum + m.tutorialCount, 0);
  const filtered = !!(params.q || params.module || level);

  return (
    <div className="container">
      <div className="page-head">
        <h1>{activeModule ? activeModule.name : "All tutorials"}</h1>
        <p>{activeModule ? activeModule.description || activeModule.tagline : "Every MineOpt feature explained with a short video and a step-by-step guide."}</p>
      </div>

      <form className="filter-bar" action="/library">
        {params.module && <input type="hidden" name="module" value={params.module} />}
        <div className="search">
          <Icon name="search" size={16} />
          <input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Search by feature, e.g. “pit shell” or “filter”" aria-label="Search tutorials" />
        </div>
        <select name="level" defaultValue={level ?? ""} aria-label="Level">
          <option value="">All levels</option>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {LEVEL_LABEL[l]}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Search
        </button>
        {filtered && (
          <Link href="/library" className="btn btn-ghost">
            Clear
          </Link>
        )}
      </form>

      <div className="chips" role="navigation" aria-label="Modules">
        <Link href={buildHref(current, { module: undefined })} className={`chip-link${!params.module ? " active" : ""}`}>
          All <span className="count">{total}</span>
        </Link>
        {modules.map((m) => (
          <Link key={m.id} href={buildHref(current, { module: m.slug })} className={`chip-link${params.module === m.slug ? " active" : ""}`}>
            {m.name} <span className="count">{m.tutorialCount}</span>
          </Link>
        ))}
      </div>

      {tutorials.length === 0 ? (
        <div className="empty">
          <h3>No tutorials found</h3>
          <p>Try a different search, or clear the filters to see everything.</p>
        </div>
      ) : (
        <>
          <p className="muted" style={{ marginBottom: 16 }}>
            {tutorials.length} {tutorials.length === 1 ? "tutorial" : "tutorials"}
          </p>
          <div className="card-grid" style={{ paddingBottom: 64 }}>
            {tutorials.map((tutorial) => (
              <TutorialCard key={tutorial.id} tutorial={tutorial} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
