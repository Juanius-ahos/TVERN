"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
      className="grid h-8 w-8 place-items-center rounded-full text-[18px] transition hover:bg-white/[0.06]"
      aria-label="Go back"
    >
      ←
    </button>
  );
}
