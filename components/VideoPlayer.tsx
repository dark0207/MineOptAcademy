import type { CSSProperties } from "react";
import { resolveEmbed } from "@/lib/video";
import { Icon } from "./Icon";

type Props = {
  tutorial: {
    id: string;
    title: string;
    videoSource: string;
    videoFile: string | null;
    videoUrl: string | null;
    thumbnailFile: string | null;
  };
  module: { accent: string; icon: string };
  /** shown to admins when there is no video yet */
  isAdmin: boolean;
};

/** Plays an uploaded file, a YouTube / Vimeo embed or a direct video link, or shows a placeholder. */
export function VideoPlayer({ tutorial, module, isAdmin }: Props) {
  const poster = tutorial.thumbnailFile ? `/api/media/thumbnail/${tutorial.id}` : undefined;

  if (tutorial.videoSource === "UPLOAD" && tutorial.videoFile) {
    return (
      <div className="player">
        <video controls preload="metadata" poster={poster} playsInline controlsList="nodownload">
          <source src={`/api/media/video/${tutorial.id}`} />
          Your browser can not play this video.
        </video>
      </div>
    );
  }

  if (tutorial.videoSource === "EXTERNAL") {
    const embed = resolveEmbed(tutorial.videoUrl);
    if (embed.kind === "iframe") {
      return (
        <div className="player">
          <iframe
            src={embed.url}
            title={tutorial.title}
            loading="lazy"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      );
    }
    if (embed.kind === "file") {
      return (
        <div className="player">
          <video controls preload="metadata" poster={poster} playsInline src={embed.url} />
        </div>
      );
    }
  }

  const style = { "--accent-color": module.accent } as CSSProperties;
  return (
    <div className="player player-empty" style={style}>
      <div>
        <div className="module-icon">
          <Icon name={module.icon} size={30} />
        </div>
        <h3>Video coming soon</h3>
        <p>{isAdmin ? "Add a video to this tutorial from the admin console." : "The video for this feature is being recorded. The written guide below is ready."}</p>
      </div>
    </div>
  );
}
