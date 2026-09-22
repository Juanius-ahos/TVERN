"use client";

import { PostComposer } from "./PostComposer";

export function ReloadComposer({ initialText, placeholder }: { initialText?: string; placeholder?: string }) {
  return (
    <PostComposer
      initialText={initialText}
      placeholder={placeholder}
      onPosted={() => location.reload()}
    />
  );
}
