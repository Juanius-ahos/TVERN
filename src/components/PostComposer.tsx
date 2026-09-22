"use client";

import { useRef, useState } from "react";
import { useSession } from "@/lib/useSession";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export function PostComposer({ onPosted }: { onPosted?: () => void }) {
  const { user } = useSession();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function pickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", f);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const d = await res.json();
      setMedia({ url: d.url, type: d.type });
    }
    if (fileRef.current) fileRef.current.value = "";
  }

  async function post() {
    if (!body.trim() && !media) return;
    setBusy(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body, mediaUrl: media?.url, mediaType: media?.type }),
    });
    setBody("");
    setMedia(null);
    setBusy(false);
    onPosted?.();
  }

  return (
    <div className="rounded-2xl border hairline p-4">
      <div className="flex gap-3">
        {user && <Avatar address={user.address} src={user.avatarUrl} size={40} />}
        <div className="min-w-0 flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="what's happening on-chain?"
            rows={2}
            maxLength={500}
            className="w-full resize-none bg-transparent pt-1.5 text-[17px] outline-none placeholder:text-[var(--muted)]"
          />

          {media && (
            <div className="relative mt-2 overflow-hidden rounded-xl border hairline">
              {media.type === "video" ? (
                <video src={media.url} controls className="max-h-80 w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={media.url} alt="" className="max-h-80 w-full object-cover" />
              )}
              <button
                onClick={() => setMedia(null)}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/70 text-white"
              >
                ×
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center justify-between border-t hairline pt-2.5">
            <div className="flex items-center gap-3">
              <button
                onClick={() => fileRef.current?.click()}
                className="text-[var(--accent)] transition hover:opacity-80"
                title="Add photo or video"
              >
                <Icon name="external" size={18} />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/mp4,video/webm"
                onChange={pickFile}
                className="hidden"
              />
              <span className="text-[12px] text-[var(--muted)]">
                {uploading ? "uploading…" : `${body.length}/500`}
              </span>
            </div>
            <button
              onClick={post}
              disabled={busy || uploading || (!body.trim() && !media)}
              className="btn-accent rounded-full px-5 py-1.5 text-[14px] disabled:opacity-40"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
