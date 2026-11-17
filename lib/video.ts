export type Embed =
  | { kind: "none" }
  /** a YouTube / Vimeo player that goes in an iframe */
  | { kind: "iframe"; url: string }
  /** a direct link to a video file for the html video element */
  | { kind: "file"; url: string };

const YOUTUBE =
  /^(?:https?:\/\/)?(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
const VIMEO = /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(?:video\/)?(\d+)/i;
const FILE = /\.(mp4|m4v|webm|ogv)$/i;

/** Turns the url an admin pastes into something the page can play. */
export function resolveEmbed(input: string | null | undefined): Embed {
  const url = input?.trim();
  if (!url) return { kind: "none" };

  const youTube = YOUTUBE.exec(url);
  if (youTube) {
    return { kind: "iframe", url: `https://www.youtube-nocookie.com/embed/${youTube[1]}?rel=0` };
  }

  const vimeo = VIMEO.exec(url);
  if (vimeo) {
    return { kind: "iframe", url: `https://player.vimeo.com/video/${vimeo[1]}` };
  }

  try {
    const parsed = new URL(url);
    if ((parsed.protocol === "https:" || parsed.protocol === "http:") && FILE.test(parsed.pathname)) {
      return { kind: "file", url: parsed.toString() };
    }
  } catch {
    // not a url
  }
  return { kind: "none" };
}
