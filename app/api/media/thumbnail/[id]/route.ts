import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { serveFile } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

async function handle(request: Request, { params }: Context) {
  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({
    where: { id },
    select: { published: true, thumbnailFile: true },
  });
  if (!tutorial?.thumbnailFile) {
    return new Response("Not found", { status: 404 });
  }

  // thumbnails are shown on the public landing page, but drafts stay private
  if (!tutorial.published && (await getCurrentUser())?.role !== "ADMIN") {
    return new Response("Not found", { status: 404 });
  }

  return serveFile(request, "thumbnail", tutorial.thumbnailFile, "public, max-age=300");
}

export { handle as GET, handle as HEAD };
