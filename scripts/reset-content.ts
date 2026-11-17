/**
 * Wipes learning content and non-admin users so `npm run db:seed` can restore a clean catalogue.
 * Keeps administrator accounts.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const progress = await db.progress.deleteMany();
  const tutorials = await db.tutorial.deleteMany();
  const modules = await db.module.deleteMany();
  const learners = await db.user.deleteMany({ where: { role: { not: "ADMIN" } } });
  console.log({
    progress: progress.count,
    tutorials: tutorials.count,
    modules: modules.count,
    learners: learners.count,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
