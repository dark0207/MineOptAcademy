"use client";

import type { ReactNode } from "react";

/** A form whose submission first asks the user to confirm, e.g. before deleting. */
export function ConfirmForm({
  action,
  message,
  children,
  className = "inline-form",
}: {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {children}
    </form>
  );
}
