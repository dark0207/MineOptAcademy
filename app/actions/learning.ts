"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

/** marks a tutorial completed for the signed in user, or clears it */
export async function toggleCompletedAction(tutorialId: string, completed: boolean) {
  const user = await requireUser();

  const tutorial = await db.tutorial.findUnique({ where: { id: tutorialId }, select: { id: true, slug: true, published: true } });
  if (!tutorial || (!tutorial.published && user.role !== "ADMIN")) return;

  if (completed) {
    await db.progress.upsert({
      where: { userId_tutorialId: { userId: user.id, tutorialId } },
      create: { userId: user.id, tutorialId },
      update: {},
    });
  } else {
    await db.progress.deleteMany({ where: { userId: user.id, tutorialId } });
  }

  revalidatePath(`/library/${tutorial.slug}`);
  revalidatePath("/library");
  revalidatePath("/learning");
}
