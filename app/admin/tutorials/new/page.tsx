import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { TutorialForm } from "@/components/admin/TutorialForm";

export const metadata: Metadata = { title: "New tutorial" };

export default async function NewTutorial({ searchParams }: { searchParams: Promise<{ module?: string }> }) {
  await requireAdmin();
  const { module } = await searchParams;
  const modules = await db.module.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true } });

  if (modules.length === 0) {
    return (
      <div className="empty">
        <h3>Create a module first</h3>
        <p style={{ marginBottom: 16 }}>Tutorials belong to a module such as PitOpt or SchedOpt.</p>
        <Link href="/admin/modules/new" className="btn btn-primary">
          New module
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="admin-title">
        <div>
          <h1>New tutorial</h1>
          <p>Describe the feature first; you can add the video right after saving.</p>
        </div>
      </div>
      <TutorialForm
        modules={modules}
        maxVideoMb={Math.round(config.maxVideoBytes / 1024 / 1024)}
        maxThumbnailMb={Math.round(config.maxThumbnailBytes / 1024 / 1024)}
        initial={{
          moduleId: modules.find((m) => m.slug === module)?.id ?? modules[0].id,
          title: "",
          slug: "",
          summary: "",
          description: "",
          steps: "",
          videoSource: "NONE",
          videoUrl: "",
          durationMinutes: 0,
          level: "BEGINNER",
          sortOrder: 0,
          published: false,
          featured: false,
          videoFile: null,
          thumbnailFile: null,
        }}
      />
    </>
  );
}
