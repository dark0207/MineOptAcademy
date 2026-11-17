"use client";

import { useOptimistic, useTransition } from "react";
import { toggleCompletedAction } from "@/app/actions/learning";
import { Icon } from "./Icon";

/** Marks a tutorial as completed (or clears it); updates instantly and syncs in the background. */
export function CompleteButton({ tutorialId, completed }: { tutorialId: string; completed: boolean }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(completed);

  return (
    <button
      type="button"
      className={`btn btn-lg ${optimistic ? "btn-success" : "btn-primary"}`}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await toggleCompletedAction(tutorialId, !optimistic);
        })
      }
    >
      <Icon name="check" size={18} />
      {optimistic ? "Completed" : "Mark as complete"}
    </button>
  );
}
