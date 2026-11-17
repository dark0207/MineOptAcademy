"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import type { FormState } from "@/lib/validation";
import { SubmitButton } from "./SubmitButton";

const initial: FormState = {};

function Field({
  name,
  label,
  type = "text",
  state,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  state: FormState;
  autoComplete?: string;
}) {
  const error = state.fieldErrors?.[name];
  const keepValue = type !== "password" ? state.values?.[name] : undefined;
  return (
    <div className={`field${error ? " invalid" : ""}`}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={keepValue} autoComplete={autoComplete} aria-invalid={!!error} required />
      {error ? <p className="error-text">{error}</p> : null}
    </div>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(loginAction, initial);
  return (
    <form action={action} noValidate>
      {state.error && <div className="alert alert-error" role="alert">{state.error}</div>}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field name="email" label="Email" type="email" state={state} autoComplete="email" />
      <Field name="password" label="Password" type="password" state={state} autoComplete="current-password" />
      <SubmitButton className="btn btn-primary btn-lg" busy="Signing in…">
        Sign in
      </SubmitButton>
    </form>
  );
}
