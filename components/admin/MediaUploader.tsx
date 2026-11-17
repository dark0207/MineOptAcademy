"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "../Icon";

type Props = {
  tutorialId: string;
  kind: "video" | "thumbnail";
  /** stored file name, or null when nothing is uploaded */
  current: string | null;
  accept: string;
  maxMb: number;
};

/**
 * Uploads a video or thumbnail straight to the server as a raw request body, with a progress bar.
 * The page refreshes afterwards so the stored file shows up.
 */
export function MediaUploader({ tutorialId, kind, current, accept, maxMb }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const request = useRef<XMLHttpRequest | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [over, setOver] = useState(false);

  const endpoint = `/api/admin/tutorials/${tutorialId}/media`;
  const noun = kind === "video" ? "video" : "thumbnail";

  function upload(file: File) {
    setError(null);
    if (file.size > maxMb * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(0)} MB; the limit is ${maxMb} MB.`);
      return;
    }

    const xhr = new XMLHttpRequest();
    request.current = xhr;
    xhr.open("PUT", `${endpoint}?kind=${kind}&name=${encodeURIComponent(file.name)}`);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      request.current = null;
      setProgress(null);
      if (xhr.status >= 200 && xhr.status < 300) {
        router.refresh();
      } else {
        let message = "The upload failed.";
        try {
          message = JSON.parse(xhr.responseText).error ?? message;
        } catch {
          // keep the generic message
        }
        setError(message);
      }
    };
    xhr.onerror = () => {
      request.current = null;
      setProgress(null);
      setError("The upload failed. Check your connection and try again.");
    };
    xhr.onabort = () => {
      request.current = null;
      setProgress(null);
    };

    setProgress(0);
    xhr.send(file);
  }

  async function remove() {
    if (!window.confirm(`Remove this ${noun}?`)) return;
    setError(null);
    const response = await fetch(`${endpoint}?kind=${kind}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setError("Could not remove the file.");
  }

  const uploading = progress !== null;

  return (
    <div>
      {current && (
        <div className="stack" style={{ marginBottom: 14 }}>
          {kind === "thumbnail" && (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own route
            <img className="thumb-preview" src={`/api/media/thumbnail/${tutorialId}?v=${current}`} alt="Current thumbnail" />
          )}
          <div className="file-row">
            <Icon name={kind === "video" ? "film" : "image"} size={20} />
            <div className="grow">
              <div className="name">{kind === "video" ? "Video uploaded" : "Thumbnail set"}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {current.slice(0, 8)}…{current.slice(current.lastIndexOf("."))}
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-danger" onClick={remove} disabled={uploading}>
              Remove
            </button>
          </div>
        </div>
      )}

      <label
        className={`dropzone${over ? " over" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const file = e.dataTransfer.files[0];
          if (file && !uploading) upload(file);
        }}
      >
        <Icon name="upload" size={26} />
        <strong>{current ? `Replace ${noun}` : `Upload ${noun}`}</strong>
        <span style={{ fontSize: 13 }}>
          Drop a file here or click to browse ({accept.replaceAll(",", " ")}, up to {maxMb} MB)
        </span>
        <input
          ref={input}
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </label>

      {uploading && (
        <div className="upload-progress" aria-live="polite">
          <div className="row between" style={{ marginBottom: 6, fontSize: 13 }}>
            <span>Uploading… {progress}%</span>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => request.current?.abort()}>
              Cancel
            </button>
          </div>
          <div className="bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {error && (
        <p className="error-text" role="alert" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}
