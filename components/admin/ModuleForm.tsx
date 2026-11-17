"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveModuleAction } from "@/app/actions/admin";
import type { FormState } from "@/lib/validation";
import { Icon, MODULE_ICONS } from "../Icon";
import { SubmitButton } from "../SubmitButton";
export type ModuleFormValues = {
  id?: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  icon: string;
  accent: string;
  sortOrder: number;
};

export function ModuleForm({ initial }: { initial: ModuleFormValues }) {
  const [state, action] = useActionState<FormState, FormData>(saveModuleAction, {});
  const v = (name: keyof ModuleFormValues, fallback: string | number) => state.values?.[name] ?? String(fallback);
  const err = (name: string) => state.fieldErrors?.[name];

  const [icon, setIcon] = useState(initial.icon);
  const [accent, setAccent] = useState(initial.accent);

  return (
    <form action={action} noValidate className="card card-pad" style={{ maxWidth: 760 }}>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {state.error && <div className="alert alert-error" role="alert">{state.error}</div>}
      {state.ok && <div className="alert alert-success" role="status">Saved.</div>}

      <div className="grid-2">
        <div className={`field${err("name") ? " invalid" : ""}`}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" defaultValue={v("name", initial.name)} placeholder="e.g. PitOpt" />
          {err("name") && <p className="error-text">{err("name")}</p>}
        </div>
        <div className="field">
          <label htmlFor="slug">URL slug</label>
          <input id="slug" name="slug" type="text" defaultValue={v("slug", initial.slug)} placeholder="generated from the name" />
        </div>
      </div>

      <div className="field">
        <label htmlFor="tagline">Tagline</label>
        <input id="tagline" name="tagline" type="text" defaultValue={v("tagline", initial.tagline)} placeholder="One short line shown on the module tile" />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea id="description" name="description" rows={3} defaultValue={v("description", initial.description)} />
      </div>

      <div className="grid-3">
        <div className="field">
          <label htmlFor="icon">Icon</label>
          <div className="row" style={{ flexWrap: "nowrap" }}>
            <span className="module-icon" style={{ "--accent-color": accent } as React.CSSProperties}>
              <Icon name={icon} size={22} />
            </span>
            {/* unnamed select + hidden mirror: a form reset would otherwise revert the select but not the state */}
            <input type="hidden" name="icon" value={icon} />
            <select id="icon" value={icon} onChange={(e) => setIcon(e.target.value)}>
              {MODULE_ICONS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={`field${err("accent") ? " invalid" : ""}`}>
          <label htmlFor="accent">Colour</label>
          <input id="accent" name="accent" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
          {err("accent") && <p className="error-text">{err("accent")}</p>}
        </div>
        <div className="field">
          <label htmlFor="sortOrder">Order</label>
          <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={v("sortOrder", initial.sortOrder)} />
        </div>
      </div>

      <div className="row">
        <SubmitButton busy="Saving…">{initial.id ? "Save changes" : "Create module"}</SubmitButton>
        <Link href="/admin/modules" className="btn btn-ghost">
          Back to modules
        </Link>
      </div>
    </form>
  );
}
