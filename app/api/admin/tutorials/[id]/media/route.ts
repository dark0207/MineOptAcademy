import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { blobEnabled, deleteMedia, isRemoteMedia, saveUpload, UploadError, type MediaKind } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

const json = (body: unknown, status = 200) => Response.json(body, { status });

/** Admin only, and the Origin must match so another site can not upload with the admin's cookie. */
async function authorize(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) {
    return json({ error: "Cross-site requests are not allowed." }, 403);
  }
  const user = await getCurrentUser();
  if (!user) return json({ error: "Sign in required." }, 401);
  if (user.role !== "ADMIN") return json({ error: "Administrators only." }, 403);
  return null;
}

function kindOf(request: Request): MediaKind | null {
  const kind = new URL(request.url).searchParams.get("kind");
  return kind === "video" || kind === "thumbnail" ? kind : null;
}

async function attachMedia(id: string, kind: MediaKind, fileName: string) {
  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { videoFile: true, thumbnailFile: true } });
  if (!tutorial) return json({ error: "Tutorial not found." }, 404);

  const previous = kind === "video" ? tutorial.videoFile : tutorial.thumbnailFile;
  await db.tutorial.update({
    where: { id },
    data: kind === "video" ? { videoFile: fileName, videoSource: "UPLOAD", videoUrl: null } : { thumbnailFile: fileName },
  });
  if (previous && previous !== fileName) await deleteMedia(kind, previous);

  revalidatePath("/", "layout");
  return json({ fileName });
}

/**
 * Finalize a Vercel Blob client upload: the file is already in Blob; we only store its URL.
 */
export async function POST(request: Request, { params }: Context) {
  const denied = await authorize(request);
  if (denied) return denied;

  const kind = kindOf(request);
  if (!kind) return json({ error: "Missing kind." }, 400);

  let url = "";
  try {
    const body = (await request.json()) as { url?: string };
    url = body.url?.trim() ?? "";
  } catch {
    return json({ error: "Invalid JSON body." }, 400);
  }
  if (!isRemoteMedia(url)) return json({ error: "A Blob URL is required." }, 400);

  const { id } = await params;
  return attachMedia(id, kind, url);
}

/**
 * Raw upload to local disk (self-hosted). On Vercel, use the Blob client upload flow instead.
 */
export async function PUT(request: Request, { params }: Context) {
  const denied = await authorize(request);
  if (denied) return denied;

  if (blobEnabled()) {
    return json(
      {
        error:
          "Direct uploads are disabled on this deployment. Refresh the page and try again (cloud upload).",
      },
      400,
    );
  }

  const kind = kindOf(request);
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!kind || !name) return json({ error: "Missing kind or name." }, 400);

  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { id: true } });
  if (!tutorial) return json({ error: "Tutorial not found." }, 404);

  const length = request.headers.get("content-length");
  let fileName: string;
  try {
    fileName = await saveUpload(kind, name, request.body, length ? Number(length) : null);
  } catch (error) {
    if (error instanceof UploadError) return json({ error: error.message }, error.status);
    console.error("upload failed", error);
    return json({ error: "The upload failed. Try again." }, 500);
  }

  return attachMedia(id, kind, fileName);
}

export async function DELETE(request: Request, { params }: Context) {
  const denied = await authorize(request);
  if (denied) return denied;

  const kind = kindOf(request);
  if (!kind) return json({ error: "Missing kind." }, 400);

  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { videoFile: true, thumbnailFile: true } });
  if (!tutorial) return json({ error: "Tutorial not found." }, 404);

  const previous = kind === "video" ? tutorial.videoFile : tutorial.thumbnailFile;
  await db.tutorial.update({
    where: { id },
    data: kind === "video" ? { videoFile: null, videoSource: "NONE" } : { thumbnailFile: null },
  });
  await deleteMedia(kind, previous);

  revalidatePath("/", "layout");
  return json({ ok: true });
}
