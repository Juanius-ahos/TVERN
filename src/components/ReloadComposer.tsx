"use client";

import { PostComposer } from "./PostComposer";

export function ReloadComposer({
  initialText,
  placeholder,
  parentId,
  submitLabel,
}: {
  initialText?: string;
  placeholder?: string;
  parentId?: string;
  submitLabel?: string;
}) {
  return (
    <PostComposer
      initialText={initialText}
      placeholder={placeholder}
      parentId={parentId}
      submitLabel={submitLabel}
      onPosted={() => location.reload()}
    />
  );
}
