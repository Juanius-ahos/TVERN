"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

export type Me = {
  id: string;
  address: string;
  username: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  website?: string | null;
} | null;

export function useSession() {
  const qc = useQueryClient();
  const q = useQuery<{ user: Me }>({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      return res.json();
    },
    staleTime: 30_000,
  });
  return {
    user: q.data?.user ?? null,
    loading: q.isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: ["me"] }),
  };
}
