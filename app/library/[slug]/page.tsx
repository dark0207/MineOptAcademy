import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LEVEL_LABEL, type Level } from "@/lib/constants";
import { formatDuration, formatViews } from "@/lib/format";
import { getTutorialBySlug } from "@/lib/queries";
import { Icon } from "@/components/Icon";
import { Markdown } from "@/components/Markdown";
import { VideoPlayer } from "@/components/VideoPlayer";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tutorial = await db.tutorial.findUnique({ where: { slug }, select: { title: true, summary: true, published: true } });
  return tutorial?.published ? { title: tutorial.title, description: tutorial.summary } : { title: "Tutorial" };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";

  const tutorial = await getTutorialBySlug(slug, isAdmin);
  if (!tutorial) notFound();

  const playlist = tutorial.module.tutorials;
  const index = playlist.findIndex((t) => t.id === tutorial.id);
  const previous = index > 0 ? playlist[index - 1] : null;
  const next = index >= 0 && index < playlist.length - 1 ? playlist[index + 1] : null;

  // learners and anonymous visitors only — admin preview/editing must not inflate the count
  const countThisView = !isAdmin;
  if (countThisView) {
    void db.tutorial.update({ where: { id: tutorial.id }, data: { viewCount: { increment: 1 } } }).catch(() => undefined);
  }
  const displayedViews = tutorial.viewCount + (countThisView ? 1 : 0);

  const style = { "--accent-color": tutorial.module.accent } as CSSProperties;

  return (
    <div className="container" style={style}>
      <div className="watch">
        <article>
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/library">Tutorials</Link>
            <Icon name="arrow-right" size={12} />
            <Link href={`/library?module=${tutorial.module.slug}`}>{tutorial.module.name}</Link>
          </nav>

          {!tutorial.published && <div className="alert alert-info">This tutorial is a draft. Only administrators can see it.</div>}

          <VideoPlayer tutorial={tutorial} module={tutorial.module} isAdmin={isAdmin} />

          <h1>{tutorial.title}</h1>
          <div className="meta-row">
            <span className="badge badge-accent">{tutorial.module.name}</span>
            <span className="badge">{LEVEL_LABEL[tutorial.level as Level]}</span>
            {tutorial.durationMinutes > 0 && (
              <span className="badge">
                <Icon name="clock" size={13} /> {formatDuration(tutorial.durationMinutes)}
              </span>
            )}
            <span className="badge" title={`${displayedViews} views`}>
              <Icon name="eye" size={13} /> {formatViews(displayedViews)} views
            </span>
          </div>

          {isAdmin && (
            <div className="watch-actions">
              <Link href={`/admin/tutorials/${tutorial.id}`} className="btn btn-lg">
                <Icon name="edit" size={16} /> Edit
              </Link>
            </div>
          )}

          {tutorial.summary && <p className="lead-summary">{tutorial.summary}</p>}

          {tutorial.description.trim() && (
            <section className="content-block">
              <h2>
                <Icon name="book" size={20} /> About this feature
              </h2>
              <Markdown>{tutorial.description}</Markdown>
            </section>
          )}

          {tutorial.steps.trim() && (
            <section className="content-block">
              <h2>
                <Icon name="list" size={20} /> Step by step
              </h2>
              <Markdown className="steps">{tutorial.steps}</Markdown>
            </section>
          )}

          {(previous || next) && (
            <div className="pager">
              {previous ? (
                <Link href={`/library/${previous.slug}`}>
                  <small>
                    <Icon name="arrow-left" size={14} /> Previous
                  </small>
                  <strong>{previous.title}</strong>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link href={`/library/${next.slug}`} className="next">
                  <small>
                    Next <Icon name="arrow-right" size={14} />
                  </small>
                  <strong>{next.title}</strong>
                </Link>
              ) : (
                <span />
              )}
            </div>
          )}
        </article>

        <aside className="card playlist" aria-label={`${tutorial.module.name} tutorials`}>
          <div className="playlist-head">
            <h3>{tutorial.module.name}</h3>
            <span className="muted" style={{ fontSize: 13 }}>
              {playlist.length} tutorials
            </span>
          </div>
          <ol>
            {playlist.map((item, i) => (
              <li key={item.id}>
                <Link href={`/library/${item.slug}`} aria-current={item.id === tutorial.id ? "page" : undefined}>
                  <span className="num">{i + 1}</span>
                  <span>
                    {item.title}
                    {!item.published && <span className="badge" style={{ marginLeft: 8 }}>Draft</span>}
                  </span>
                  {item.durationMinutes > 0 && <span className="time">{formatDuration(item.durationMinutes)}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
