"use client";

import { useRef, useState } from "react";
import { useSession } from "@/lib/useSession";
import { Avatar } from "./Avatar";
import { Icon } from "./Icon";

export function PostComposer({
  onPosted,
  initialText = "",
  placeholder = "what's happening on-chain?",
  parentId,
  submitLabel = "Post",
}: {
  onPosted?: () => void;
  initialText?: string;
  placeholder?: string;
  parentId?: string;
  submitLabel?: string;
}) {
  const { user } = useSession();
  const [body, setBody] = useState(initialText);
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<{ url: string; type: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pollOpts, setPollOpts] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const allowPoll = !parentId;

  function togglePoll() {
    setPollOpts((p) => (p ? null : ["", ""]));
  }
  function setOpt(i: number, v: string) {
    setPollOpts((p) => (p ? p.map((o, j) => (j === i ? v : o)) : p));
  }
  function addOpt() {
    setPollOpts((p) => (p && p.length < 4 ? [...p, ""] : p));
  }

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

  const validPoll = pollOpts ? pollOpts.filter((o) => o.trim()).length >= 2 : false;
  const canSubmit = (!!body.trim() || !!media || validPoll) && !(pollOpts && !validPoll);

  async function post() {
    if (!canSubmit) return;
    setBusy(true);
    await fetch("/api/posts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        body,
        mediaUrl: media?.url,
        mediaType: media?.type,
        parentId,
        poll: validPoll ? { options: pollOpts } : undefined,
      }),
    });
    setBody("");
    setMedia(null);
    setPollOpts(null);
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
            placeholder={placeholder}
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

          {pollOpts && (
            <div className="mt-2 space-y-2 rounded-xl border hairline p-3">
              {pollOpts.map((o, i) => (
                <input
                  key={i}
                  value={o}
                  onChange={(e) => setOpt(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  maxLength={60}
                  className="w-full rounded-lg border hairline bg-transparent px-3 py-1.5 text-[14px] outline-none focus:border-[color:var(--accent)]/60"
                />
              ))}
              <div className="flex items-center justify-between">
                {pollOpts.length < 4 ? (
                  <button onClick={addOpt} className="text-[13px] font-semibold text-[var(--accent)] hover:opacity-80">
                    + Add option
                  </button>
                ) : (
                  <span />
                )}
                <button onClick={togglePoll} className="text-[13px] text-[var(--muted)] hover:text-rose-400">
                  Remove poll
                </button>
              </div>
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
              {allowPoll && (
                <button
                  onClick={togglePoll}
                  className={`transition hover:opacity-80 ${pollOpts ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}
                  title="Add a poll"
                >
                  <Icon name="trending" size={18} />
                </button>
              )}
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
              disabled={busy || uploading || !canSubmit}
              className="btn-accent rounded-full px-5 py-1.5 text-[14px] disabled:opacity-40"
            >
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
