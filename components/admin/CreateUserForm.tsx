"use client";

import { useActionState } from "react";
import { createUserAction } from "@/app/actions/admin";
import type { FormState } from "@/lib/validation";
import { Icon } from "../Icon";
import { SubmitButton } from "../SubmitButton";

/** Lets an administrator create an account directly, which is how people join when self sign-up is closed. */
export function CreateUserForm() {
  const [state, action] = useActionState<FormState, FormData>(createUserAction, {});
  const err = (name: string) => state.fieldErrors?.[name];
  const keep = (name: string) => state.values?.[name];

  return (
    <details className="card card-pad" style={{ marginBottom: 22 }} open={!!state.fieldErrors || !!state.ok}>
      <summary style={{ cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
        <Icon name="plus" size={16} /> Create a user
      </summary>

      <form action={action} noValidate style={{ marginTop: 20 }} key={state.ok ? `ok-${state.savedAt}` : "form"}>
        {state.ok && (
          <div key={state.savedAt} className="alert alert-success" role="status">
            User created. Share the password with them securely.
          </div>
        )}
        <div className="grid-2">
          <div className={`field${err("name") ? " invalid" : ""}`}>
            <label htmlFor="new-name">Full name</label>
            <input id="new-name" name="name" type="text" defaultValue={keep("name")} autoComplete="off" />
            {err("name") && <p className="error-text">{err("name")}</p>}
          </div>
          <div className={`field${err("email") ? " invalid" : ""}`}>
            <label htmlFor="new-email">Email</label>
            <input id="new-email" name="email" type="email" defaultValue={keep("email")} autoComplete="off" />
            {err("email") && <p className="error-text">{err("email")}</p>}
          </div>
          <div className={`field${err("password") ? " invalid" : ""}`}>
            <label htmlFor="new-password">Temporary password</label>
            <input id="new-password" name="password" type="password" autoComplete="new-password" />
            {err("password") ? <p className="error-text">{err("password")}</p> : <p className="hint">At least 10 characters, with a letter and a number.</p>}
          </div>
          <div className="field">
            <label htmlFor="new-role">Role</label>
            <select id="new-role" name="role" defaultValue={keep("role") ?? "USER"}>
              <option value="USER">Learner</option>
              <option value="ADMIN">Administrator</option>
            </select>
          </div>
        </div>
        <SubmitButton busy="Creating…">Create user</SubmitButton>
      </form>
    </details>
  );
}
