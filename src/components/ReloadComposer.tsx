"use client";

import { PostComposer } from "./PostComposer";

export function ReloadComposer({
  initialText,
  placeholder,
  parentId,
  communityId,
  submitLabel,
}: {
  initialText?: string;
  placeholder?: string;
  parentId?: string;
  communityId?: string;
  submitLabel?: string;
}) {
  return (
    <PostComposer
      initialText={initialText}
      placeholder={placeholder}
      parentId={parentId}
      communityId={communityId}
      submitLabel={submitLabel}
      onPosted={() => location.reload()}
    />
  );
}
