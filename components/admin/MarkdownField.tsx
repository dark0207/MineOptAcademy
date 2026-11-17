"use client";

import { useId, useState } from "react";
import { Markdown } from "../Markdown";

/** A textarea for markdown with a live preview tab, so admins see what learners will see. */
export function MarkdownField({
  name,
  label,
  defaultValue,
  rows = 8,
  hint,
  error,
  placeholder,
}: {
  name: string;
  label: string;
  defaultValue: string;
  rows?: number;
  hint?: string;
  error?: string;
  placeholder?: string;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);

  return (
    <div className={`field${error ? " invalid" : ""}`}>
      <div className="row between" style={{ marginBottom: 6 }}>
        <label htmlFor={id} style={{ margin: 0 }}>
          {label}
        </label>
        <div className="md-tabs" role="tablist" style={{ margin: 0 }}>
          <button type="button" role="tab" aria-selected={!preview} onClick={() => setPreview(false)}>
            Write
          </button>
          <button type="button" role="tab" aria-selected={preview} onClick={() => setPreview(true)}>
            Preview
          </button>
        </div>
      </div>

      {/* kept mounted so the value is always submitted, even while the preview tab is shown */}
      <textarea id={id} name={name} className="mono" rows={rows} value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} hidden={preview} />
      {preview && <div className="md-preview">{value.trim() ? <Markdown>{value}</Markdown> : <span className="faint">Nothing to preview yet.</span>}</div>}

      {error ? <p className="error-text">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}
