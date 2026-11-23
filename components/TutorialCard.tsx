import type { CSSProperties } from "react";
import Link from "next/link";
import { LEVEL_LABEL, type Level } from "@/lib/constants";
import { formatDuration, formatViews } from "@/lib/format";
import { Icon } from "./Icon";

export type CardTutorial = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  durationMinutes: number;
  level: string;
  viewCount: number;
  videoSource: string;
  videoFile: string | null;
  videoUrl: string | null;
  thumbnailFile: string | null;
  module: { name: string; accent: string; icon: string };
};

export function TutorialCard({ tutorial, completed = false }: { tutorial: CardTutorial; completed?: boolean }) {
  const hasVideo = (tutorial.videoSource === "UPLOAD" && !!tutorial.videoFile) || (tutorial.videoSource === "EXTERNAL" && !!tutorial.videoUrl);
  const style = { "--accent-color": tutorial.module.accent } as CSSProperties;

  return (
    <Link href={`/library/${tutorial.slug}`} className="t-card" style={style}>
      <div className="thumb">
        {tutorial.thumbnailFile ? (
          // eslint-disable-next-line @next/next/no-img-element -- served by our own route, not an optimisable static asset
          <img src={`/api/media/thumbnail/${tutorial.id}`} alt="" loading="lazy" />
        ) : (
          <Icon name={tutorial.module.icon} size={56} />
        )}
        {hasVideo && (
          <span className="play">
            <Icon name="play" size={20} />
          </span>
        )}
        {!hasVideo && <span className="chip soon">Video coming soon</span>}
        {completed && (
          <span className="chip done">
            <Icon name="check" size={12} /> Done
          </span>
        )}
        {tutorial.durationMinutes > 0 && <span className="chip duration">{formatDuration(tutorial.durationMinutes)}</span>}
      </div>
      <div className="t-body">
        <span className="t-module">{tutorial.module.name}</span>
        <h3>{tutorial.title}</h3>
        <p>{tutorial.summary}</p>
        <div className="t-foot">
          <span className="t-meta">
            <span>{LEVEL_LABEL[tutorial.level as Level] ?? tutorial.level}</span>
            <span className="t-views" title={`${tutorial.viewCount} views`}>
              <Icon name="eye" size={13} /> {formatViews(tutorial.viewCount)}
            </span>
          </span>
          <Icon name="arrow-right" size={16} />
        </div>
      </div>
    </Link>
  );
}
