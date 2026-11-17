import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import type { VideoSource } from "@/lib/constants";
import { Icon } from "@/components/Icon";
import { TutorialForm } from "@/components/admin/TutorialForm";

export const metadata: Metadata = { title: "Edit tutorial" };

export default async function EditTutorial({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { created }] = await Promise.all([params, searchParams]);

  const [tutorial, modules] = await Promise.all([
    db.tutorial.findUnique({ where: { id } }),
    db.module.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!tutorial) notFound();

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>{tutorial.title}</h1>
          <p>
            {tutorial.published ? "Published" : "Draft"} · {tutorial.viewCount} views
          </p>
        </div>
        <Link href={`/library/${tutorial.slug}`} className="btn">
          <Icon name="external" size={15} /> View as learner
        </Link>
      </div>

      <TutorialForm
        // remount when a file is uploaded or removed so the form picks up the new stored state
        key={`${tutorial.videoFile}-${tutorial.thumbnailFile}`}
        modules={modules}
        created={created === "1"}
        maxVideoMb={Math.round(config.maxVideoBytes / 1024 / 1024)}
        maxThumbnailMb={Math.round(config.maxThumbnailBytes / 1024 / 1024)}
        initial={{
          id: tutorial.id,
          moduleId: tutorial.moduleId,
          title: tutorial.title,
          slug: tutorial.slug,
          summary: tutorial.summary,
          description: tutorial.description,
          steps: tutorial.steps,
          videoSource: tutorial.videoSource as VideoSource,
          videoUrl: tutorial.videoUrl ?? "",
          durationMinutes: tutorial.durationMinutes,
          level: tutorial.level,
          sortOrder: tutorial.sortOrder,
          published: tutorial.published,
          featured: tutorial.featured,
          videoFile: tutorial.videoFile,
          thumbnailFile: tutorial.thumbnailFile,
        }}
      />
    </>
  );
}
