"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Icon } from "../Icon";

type Props = {
  tutorialId: string;
  kind: "video" | "thumbnail";
  /** stored file name or remote Blob URL */
  current: string | null;
  accept: string;
  maxMb: number;
};

const useBlobUpload = process.env.NEXT_PUBLIC_BLOB_UPLOAD === "true";

/**
 * Uploads a video or thumbnail with a progress bar.
 * On Vercel, files go straight to Blob (bypassing the serverless body limit).
 * Self-hosted deploys still stream to the local STORAGE_DIR via PUT.
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

  function fail(message: string) {
    setProgress(null);
    setError(message);
  }

  async function uploadWithBlob(file: File) {
    setProgress(0);
    try {
      const blob = await upload(`academy/${kind}/${file.name}`, file, {
        access: "public",
        handleUploadUrl: `${endpoint}/upload`,
        clientPayload: JSON.stringify({ kind }),
        multipart: file.size > 80 * 1024 * 1024,
        onUploadProgress: ({ percentage }) => setProgress(Math.round(percentage)),
      });

      const response = await fetch(`${endpoint}?kind=${kind}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: blob.url }),
      });
      if (!response.ok) {
        let message = "The upload failed.";
        try {
          message = (await response.json()).error ?? message;
        } catch {
          // keep generic message
        }
        fail(message);
        return;
      }

      setProgress(null);
      router.refresh();
    } catch (err) {
      fail(err instanceof Error ? err.message : "The upload failed. Try again.");
    }
  }

  function uploadLocal(file: File) {
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
      fail("The upload failed. Check your connection and try again.");
    };
    xhr.onabort = () => {
      request.current = null;
      setProgress(null);
    };

    setProgress(0);
    xhr.send(file);
  }

  function startUpload(file: File) {
    setError(null);
    if (file.size > maxMb * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(0)} MB; the limit is ${maxMb} MB.`);
      return;
    }
    if (useBlobUpload) void uploadWithBlob(file);
    else uploadLocal(file);
  }

  async function remove() {
    if (!window.confirm(`Remove this ${noun}?`)) return;
    setError(null);
    const response = await fetch(`${endpoint}?kind=${kind}`, { method: "DELETE" });
    if (response.ok) router.refresh();
    else setError("Could not remove the file.");
  }

  const uploading = progress !== null;
  const label = current?.startsWith("http")
    ? "Cloud file"
    : current
      ? `${current.slice(0, 8)}…${current.slice(current.lastIndexOf("."))}`
      : null;

  return (
    <div>
      {current && (
        <div className="stack" style={{ marginBottom: 14 }}>
          {kind === "thumbnail" && (
            // eslint-disable-next-line @next/next/no-img-element -- served by our own route
            <img className="thumb-preview" src={`/api/media/thumbnail/${tutorialId}?v=${encodeURIComponent(current)}`} alt="Current thumbnail" />
          )}
          <div className="file-row">
            <Icon name={kind === "video" ? "film" : "image"} size={20} />
            <div className="grow">
              <div className="name">{kind === "video" ? "Video uploaded" : "Thumbnail set"}</div>
              <div className="faint" style={{ fontSize: 12 }}>
                {label}
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
          if (file && !uploading) startUpload(file);
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
            if (file) startUpload(file);
            e.target.value = "";
          }}
        />
      </label>

      {uploading && (
        <div className="upload-progress" aria-live="polite">
          <div className="row between" style={{ marginBottom: 6, fontSize: 13 }}>
            <span>Uploading… {progress}%</span>
            {!useBlobUpload && (
              <button type="button" className="btn btn-sm btn-ghost" onClick={() => request.current?.abort()}>
                Cancel
              </button>
            )}
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
