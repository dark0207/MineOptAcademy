import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { deleteMedia, saveUpload, UploadError, type MediaKind } from "@/lib/storage";

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

/**
 * Raw upload: the request body is the file, its name is in ?name=.
 * Streaming the body (rather than multipart) lets large videos upload without being buffered.
 */
export async function PUT(request: Request, { params }: Context) {
  const denied = await authorize(request);
  if (denied) return denied;

  const kind = kindOf(request);
  const name = new URL(request.url).searchParams.get("name") ?? "";
  if (!kind || !name) return json({ error: "Missing kind or name." }, 400);

  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({ where: { id }, select: { videoFile: true, thumbnailFile: true } });
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

  const previous = kind === "video" ? tutorial.videoFile : tutorial.thumbnailFile;
  await db.tutorial.update({
    where: { id },
    data: kind === "video" ? { videoFile: fileName, videoSource: "UPLOAD", videoUrl: null } : { thumbnailFile: fileName },
  });
  await deleteMedia(kind, previous);

  revalidatePath("/", "layout");
  return json({ fileName });
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
