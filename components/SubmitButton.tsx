"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

/** Submit button that disables itself and shows a busy label while its form action runs. */
export function SubmitButton({ children, busy = "Working…", className = "btn btn-primary" }: { children: ReactNode; busy?: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? busy : children}
    </button>
  );
}
