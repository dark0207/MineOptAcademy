import { redirect } from "next/navigation";

/** Learner accounts and progress tracking were removed; tutorials are public. */
export default function LearningPage() {
  redirect("/library");
}
