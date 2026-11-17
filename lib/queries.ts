import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "./db";
import type { Level } from "./constants";

const published = { published: true } satisfies Prisma.TutorialWhereInput;

/** modules with the number of published tutorials and their total running time */
export const getModulesWithStats = cache(async () => {
  const modules = await db.module.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      tutorials: {
        where: published,
        select: { id: true, durationMinutes: true, videoSource: true },
      },
    },
  });
  return modules.map(({ tutorials, ...module }) => ({
    ...module,
    tutorialCount: tutorials.length,
    minutes: tutorials.reduce((sum, t) => sum + t.durationMinutes, 0),
  }));
});

export type LibraryFilter = {
  q?: string;
  module?: string;
  level?: Level;
};

export async function getLibrary(filter: LibraryFilter) {
  const q = filter.q?.trim();
  return db.tutorial.findMany({
    where: {
      ...published,
      ...(filter.module ? { module: { slug: filter.module } } : {}),
      ...(filter.level ? { level: filter.level } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { summary: { contains: q } },
              { description: { contains: q } },
              { steps: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ module: { sortOrder: "asc" } }, { sortOrder: "asc" }, { title: "asc" }],
    include: { module: { select: { slug: true, name: true, accent: true, icon: true } } },
  });
}

export async function getFeatured(limit = 6) {
  return db.tutorial.findMany({
    where: { ...published, featured: true },
    orderBy: [{ sortOrder: "asc" }],
    take: limit,
    include: { module: { select: { slug: true, name: true, accent: true, icon: true } } },
  });
}

export async function getSiteStats() {
  const [tutorials, videos, modules, minutes] = await Promise.all([
    db.tutorial.count({ where: published }),
    db.tutorial.count({ where: { ...published, videoSource: { not: "NONE" } } }),
    db.module.count(),
    db.tutorial.aggregate({ where: published, _sum: { durationMinutes: true } }),
  ]);
  return { tutorials, videos, modules, minutes: minutes._sum.durationMinutes ?? 0 };
}

/** a tutorial with its module playlist; drafts are only returned when `includeDrafts` is set */
export async function getTutorialBySlug(slug: string, includeDrafts: boolean) {
  const tutorial = await db.tutorial.findUnique({
    where: { slug },
    include: {
      module: {
        include: {
          tutorials: {
            where: includeDrafts ? {} : published,
            orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
            select: { id: true, slug: true, title: true, durationMinutes: true, published: true, videoSource: true },
          },
        },
      },
    },
  });
  if (!tutorial || (!tutorial.published && !includeDrafts)) return null;
  return tutorial;
}

export async function getCompletedIds(userId: string): Promise<Set<string>> {
  const rows = await db.progress.findMany({ where: { userId }, select: { tutorialId: true } });
  return new Set(rows.map((r) => r.tutorialId));
}
