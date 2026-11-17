"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveTutorialAction } from "@/app/actions/admin";
import { IMAGE_EXTENSIONS, LEVELS, LEVEL_LABEL, VIDEO_EXTENSIONS, type VideoSource } from "@/lib/constants";
import type { FormState } from "@/lib/validation";
import { Icon } from "../Icon";
import { SubmitButton } from "../SubmitButton";
import { MarkdownField } from "./MarkdownField";
import { MediaUploader } from "./MediaUploader";

export type TutorialFormValues = {
  id?: string;
  moduleId: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  steps: string;
  videoSource: VideoSource;
  videoUrl: string;
  durationMinutes: number;
  level: string;
  sortOrder: number;
  published: boolean;
  featured: boolean;
  videoFile: string | null;
  thumbnailFile: string | null;
};

const SOURCES: { value: VideoSource; label: string; hint: string }[] = [
  { value: "UPLOAD", label: "Upload a file", hint: "Stored on this server" },
  { value: "EXTERNAL", label: "YouTube / Vimeo link", hint: "Embedded player" },
  { value: "NONE", label: "No video yet", hint: "Shows “coming soon”" },
];

export function TutorialForm({
  modules,
  initial,
  created,
  maxVideoMb,
  maxThumbnailMb,
}: {
  modules: { id: string; name: string }[];
  initial: TutorialFormValues;
  created?: boolean;
  maxVideoMb: number;
  maxThumbnailMb: number;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTutorialAction, {});
  const [source, setSource] = useState<VideoSource>(initial.videoSource);
  const isNew = !initial.id;

  // value shown for a field: what the user just submitted, otherwise what is stored
  const v = (name: keyof TutorialFormValues, fallback: string | number) => state.values?.[name] ?? String(fallback);
  const err = (name: string) => state.fieldErrors?.[name];

  return (
    <form action={action} noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      {created && <div className="alert alert-success">Tutorial created. Now add its video and thumbnail on the right.</div>}
      {state.error && <div className="alert alert-error" role="alert">{state.error}</div>}

      <div className="editor-grid">
        <div className="stack" style={{ "--gap": "22px" } as React.CSSProperties}>
          <section className="card card-pad">
            <h2 className="card-title">Details</h2>
            <div className={`field${err("title") ? " invalid" : ""}`}>
              <label htmlFor="title">Title</label>
              <input id="title" name="title" type="text" defaultValue={v("title", initial.title)} placeholder="e.g. Run the optimisation and generate pit shells" />
              {err("title") && <p className="error-text">{err("title")}</p>}
            </div>

            <div className={`field${err("summary") ? " invalid" : ""}`}>
              <label htmlFor="summary">Summary</label>
              <textarea id="summary" name="summary" rows={2} defaultValue={v("summary", initial.summary)} placeholder="One or two sentences shown on cards and in search." />
              {err("summary") ? <p className="error-text">{err("summary")}</p> : <p className="hint">Max 400 characters.</p>}
            </div>

            <div className="grid-2">
              <div className={`field${err("moduleId") ? " invalid" : ""}`}>
                <label htmlFor="moduleId">Module</label>
                <select id="moduleId" name="moduleId" defaultValue={v("moduleId", initial.moduleId)}>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {err("moduleId") && <p className="error-text">{err("moduleId")}</p>}
              </div>
              <div className="field">
                <label htmlFor="level">Level</label>
                <select id="level" name="level" defaultValue={v("level", initial.level)}>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {LEVEL_LABEL[l]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="card-title">Content</h2>
            <MarkdownField
              name="description"
              label="Description"
              defaultValue={v("description", initial.description)}
              rows={9}
              error={err("description")}
              hint="Markdown: **bold**, lists, `code`, links and tables are supported."
              placeholder="Explain what the feature does and when to use it."
            />
            <MarkdownField
              name="steps"
              label="Step by step"
              defaultValue={v("steps", initial.steps)}
              rows={9}
              error={err("steps")}
              hint="A numbered list works best: start each step with 1. 2. 3."
              placeholder={"1. Open **PitOpt → Model**.\n2. Import the block model."}
            />
          </section>
        </div>

        <div className="side-stack">
          <section className="card card-pad">
            <h2 className="card-title">Publishing</h2>
            <label className="check" style={{ marginBottom: 14 }}>
              <input type="checkbox" name="published" defaultChecked={state.values ? state.values.published === "on" : initial.published} />
              Published (visible to learners)
            </label>
            <label className="check" style={{ marginBottom: 20 }}>
              <input type="checkbox" name="featured" defaultChecked={state.values ? state.values.featured === "on" : initial.featured} />
              Featured on the home page
            </label>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="durationMinutes">Duration (min)</label>
                <input id="durationMinutes" name="durationMinutes" type="number" min={0} max={600} defaultValue={v("durationMinutes", initial.durationMinutes)} />
              </div>
              <div className="field">
                <label htmlFor="sortOrder">Order</label>
                <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={v("sortOrder", initial.sortOrder)} />
              </div>
            </div>
            <div className="field">
              <label htmlFor="slug">URL slug</label>
              <input id="slug" name="slug" type="text" defaultValue={v("slug", initial.slug)} placeholder="generated from the title" />
              <p className="hint">Leave empty to generate it from the title.</p>
            </div>
            <div className="row">
              <SubmitButton busy="Saving…">{isNew ? "Create tutorial" : "Save changes"}</SubmitButton>
              <Link href="/admin/tutorials" className="btn btn-ghost">
                Cancel
              </Link>
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="card-title">
              <Icon name="video" size={16} /> Video
            </h2>
            {/* The radios have no name: React resets forms after each save, which would revert named controlled
                radios while the state still shows the old choice. The hidden input always mirrors the state. */}
            <input type="hidden" name="videoSource" value={source} />
            <div className="stack" style={{ "--gap": "8px", marginBottom: 18 } as React.CSSProperties}>
              {SOURCES.map((option) => (
                <label key={option.value} className="check">
                  <input type="radio" value={option.value} checked={source === option.value} onChange={() => setSource(option.value)} aria-label={option.label} />
                  <span>
                    {option.label} <span className="faint">· {option.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            {source === "EXTERNAL" && (
              <div className={`field${err("videoUrl") ? " invalid" : ""}`}>
                <label htmlFor="videoUrl">Video link</label>
                <input id="videoUrl" name="videoUrl" type="url" defaultValue={v("videoUrl", initial.videoUrl)} placeholder="https://www.youtube.com/watch?v=…" />
                {err("videoUrl") ? <p className="error-text">{err("videoUrl")}</p> : <p className="hint">YouTube, Vimeo, or a direct .mp4 / .webm link.</p>}
              </div>
            )}

            {source === "UPLOAD" &&
              (initial.id ? (
                <MediaUploader tutorialId={initial.id} kind="video" current={initial.videoFile} accept={VIDEO_EXTENSIONS.join(",")} maxMb={maxVideoMb} />
              ) : (
                <p className="hint">Create the tutorial first, then upload the video here.</p>
              ))}
            {source === "UPLOAD" && initial.id && initial.videoSource !== "UPLOAD" && (
              <p className="hint" style={{ marginTop: 10 }}>
                Uploading switches this tutorial to the uploaded video straight away.
              </p>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="card-title">
              <Icon name="image" size={16} /> Thumbnail
            </h2>
            {initial.id ? (
              <MediaUploader tutorialId={initial.id} kind="thumbnail" current={initial.thumbnailFile} accept={IMAGE_EXTENSIONS.join(",")} maxMb={maxThumbnailMb} />
            ) : (
              <p className="hint">Create the tutorial first, then upload a thumbnail. Without one, the module icon is shown.</p>
            )}
          </section>
        </div>
      </div>

      {/* keyed so every save replays the fade-in / fade-out animation */}
      {state.savedAt && (
        <div key={state.savedAt} className="toast" role="status">
          Saved
        </div>
      )}
    </form>
  );
}
