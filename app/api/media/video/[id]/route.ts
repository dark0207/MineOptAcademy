import { db } from "@/lib/db";
import { config } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";
import { serveFile } from "@/lib/storage";

type Context = { params: Promise<{ id: string }> };

async function handle(request: Request, { params }: Context) {
  const { id } = await params;
  const tutorial = await db.tutorial.findUnique({
    where: { id },
    select: { published: true, videoSource: true, videoFile: true },
  });
  if (!tutorial || tutorial.videoSource !== "UPLOAD" || !tutorial.videoFile) {
    return new Response("Not found", { status: 404 });
  }

  const user = await getCurrentUser();
  const isAdmin = user?.role === "ADMIN";
  if (!tutorial.published && !isAdmin) {
    return new Response("Not found", { status: 404 });
  }
  // published videos are public by default; set PUBLIC_LIBRARY=false to require an admin session
  if (!config.publicLibrary && !isAdmin) {
    return new Response("Not found", { status: 404 });
  }

  return serveFile(request, "video", tutorial.videoFile, "private, max-age=3600");
}

export { handle as GET, handle as HEAD };
