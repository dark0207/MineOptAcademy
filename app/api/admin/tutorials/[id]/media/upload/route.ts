import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { deleteMedia, type MediaKind } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

/**
 * Issues a short-lived Blob client token (and receives upload-completed webhooks).
 * The browser uploads straight to Vercel Blob, which avoids the serverless body-size limit.
 */
export async function POST(request: Request, { params }: Context) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Sign in required." }, { status: 401 });
  if (user.role !== "ADMIN") return Response.json({ error: "Administrators only." }, { status: 403 });

  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({
    where: { id },
    select: { id: true, videoFile: true, thumbnailFile: true },
  });
  if (!tutorial) return Response.json({ error: "Tutorial not found." }, { status: 404 });

  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let kind: MediaKind = "video";
        try {
          const parsed = JSON.parse(clientPayload || "{}") as { kind?: string };
          if (parsed.kind === "thumbnail") kind = "thumbnail";
          else if (parsed.kind === "video") kind = "video";
          else throw new Error("Missing kind.");
        } catch {
          throw new Error("Missing kind.");
        }

        return {
          allowedContentTypes:
            kind === "video"
              ? ["video/mp4", "video/webm", "video/ogg", "video/x-m4v", "application/octet-stream"]
              : ["image/jpeg", "image/png", "image/webp", "image/jpg", "application/octet-stream"],
          maximumSizeInBytes: kind === "video" ? config.maxVideoBytes : config.maxThumbnailBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ tutorialId: id, kind }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Best-effort DB update (may not run on localhost). The client also finalizes via POST.
        if (!tokenPayload) return;
        const { tutorialId, kind } = JSON.parse(tokenPayload) as { tutorialId: string; kind: MediaKind };
        const current = await db.tutorial.findUnique({
          where: { id: tutorialId },
          select: { videoFile: true, thumbnailFile: true },
        });
        if (!current) return;

        const previous = kind === "video" ? current.videoFile : current.thumbnailFile;
        if (previous === blob.url) return;

        await db.tutorial.update({
          where: { id: tutorialId },
          data:
            kind === "video"
              ? { videoFile: blob.url, videoSource: "UPLOAD", videoUrl: null }
              : { thumbnailFile: blob.url },
        });
        await deleteMedia(kind, previous);
      },
    });

    return Response.json(json);
  } catch (error) {
    console.error("blob upload token failed", error);
    return Response.json({ error: (error as Error).message || "Upload authorization failed." }, { status: 400 });
  }
}
