import "server-only";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { del } from "@vercel/blob";
import { config } from "./config";
import { IMAGE_EXTENSIONS, VIDEO_EXTENSIONS } from "./constants";

export type MediaKind = "video" | "thumbnail";

const FOLDER: Record<MediaKind, string> = { video: "videos", thumbnail: "thumbnails" };

/** Uploaded media stored in Vercel Blob is saved as a full https URL. */
export function isRemoteMedia(fileName: string | null | undefined): fileName is string {
  return !!fileName && /^https?:\/\//i.test(fileName);
}

export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
}

const CONTENT_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".m4v": "video/mp4",
  ".webm": "video/webm",
  ".ogv": "video/ogg",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function contentTypeOf(fileName: string): string {
  return CONTENT_TYPES[path.extname(fileName).toLowerCase()] ?? "application/octet-stream";
}

/** Stored file names are always generated here, so a name containing a path is never trusted. */
export function mediaPath(kind: MediaKind, fileName: string | null | undefined): string | null {
  if (!fileName || fileName !== path.basename(fileName)) return null;
  return path.join(config.storageDir, FOLDER[kind], fileName);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries a file operation that fails with EBUSY / EPERM. On Windows, virus scanners and indexers
 * briefly lock files that were just written, which would otherwise fail an otherwise good upload.
 */
async function withRetry<T>(operation: () => Promise<T>, attempts = 20): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if ((code !== "EBUSY" && code !== "EPERM") || attempt >= attempts) throw error;
      await sleep(50 * attempt);
    }
  }
}

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

/**
 * Streams an upload to disk without holding it in memory, so multi-gigabyte videos are fine.
 * Returns the stored file name.
 */
export async function saveUpload(kind: MediaKind, originalName: string, body: ReadableStream<Uint8Array> | null, declaredLength: number | null) {
  const allowed: readonly string[] = kind === "video" ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
  const limit = kind === "video" ? config.maxVideoBytes : config.maxThumbnailBytes;
  const extension = path.extname(originalName).toLowerCase();

  if (!allowed.includes(extension)) {
    throw new UploadError(`Unsupported file type. Use one of: ${allowed.join(", ")}`, 415);
  }
  if (!body) {
    throw new UploadError("The upload is empty.");
  }
  if (declaredLength !== null && declaredLength > limit) {
    throw new UploadError(`The file is larger than ${Math.round(limit / 1024 / 1024)} MB.`, 413);
  }

  const directory = path.join(config.storageDir, FOLDER[kind]);
  await fsp.mkdir(directory, { recursive: true });

  const fileName = `${randomUUID()}${extension}`;
  const finalPath = path.join(directory, fileName);
  const partialPath = `${finalPath}.part`;

  let received = 0;
  const counter = new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      received += chunk.length;
      if (received > limit) {
        callback(new UploadError(`The file is larger than ${Math.round(limit / 1024 / 1024)} MB.`, 413));
      } else {
        callback(null, chunk);
      }
    },
  });

  try {
    await pipeline(Readable.fromWeb(body as never), counter, fs.createWriteStream(partialPath, { flags: "wx" }));
    if (received === 0) throw new UploadError("The upload is empty.");
    await withRetry(() => fsp.rename(partialPath, finalPath));
  } catch (error) {
    await withRetry(() => fsp.rm(partialPath, { force: true })).catch(() => undefined);
    throw error;
  }
  return fileName;
}

export async function deleteMedia(kind: MediaKind, fileName: string | null | undefined) {
  if (isRemoteMedia(fileName)) {
    await del(fileName).catch(() => undefined);
    return;
  }
  const target = mediaPath(kind, fileName);
  if (target) {
    await withRetry(() => fsp.rm(target, { force: true })).catch(() => undefined);
  }
}

/** Serves a stored file with HTTP range support, which browsers need to seek inside videos. */
export async function serveFile(request: Request, kind: MediaKind, fileName: string | null | undefined, cache: string) {
  if (isRemoteMedia(fileName)) {
    // Blob already supports range requests; keep access checks in the route, then redirect.
    return Response.redirect(fileName, 302);
  }

  const target = mediaPath(kind, fileName);
  if (!target) return new Response("Not found", { status: 404 });

  let size: number;
  try {
    size = (await fsp.stat(target)).size;
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": contentTypeOf(target),
    "Accept-Ranges": "bytes",
    "Cache-Control": cache,
    "X-Content-Type-Options": "nosniff",
  });

  let start = 0;
  let end = size - 1;
  let status = 200;

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    if (range[1]) {
      start = Number(range[1]);
      if (range[2]) end = Math.min(Number(range[2]), size - 1);
    } else {
      // suffix range: the last N bytes
      start = Math.max(size - Number(range[2]), 0);
    }
    if (start > end || start >= size) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    status = 206;
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  }

  headers.set("Content-Length", String(end - start + 1));
  if (request.method === "HEAD") {
    return new Response(null, { status, headers });
  }

  const stream = fs.createReadStream(target, { start, end });
  return new Response(Readable.toWeb(stream) as ReadableStream, { status, headers });
}
