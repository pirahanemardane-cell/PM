"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

export function TrackSearch({
  term,
  resultCount,
}: {
  term: string;
  resultCount: number;
}) {
  useEffect(() => {
    if (!term || term.trim().length < 2) return;
    void track({
      event_name: "search",
      search_term: term.trim(),
      result_count: resultCount,
    });
  }, [term, resultCount]);

  return null;
}
