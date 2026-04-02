"use client";

import { useState } from "react";
import Link from "next/link";
import type { IAiExplanation } from "@/lib/supabase/ai-explanations";

interface IAiExplanationCardProps {
  explanation: IAiExplanation;
  shareId?: string | null;
}

export const AiExplanationCard = ({ explanation, shareId }: IAiExplanationCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const date = new Date(explanation.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const text = explanation.explanation;
  const preview = text.length > 100 ? text.slice(0, 100) + "..." : text;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-xs text-muted">{date}</p>
          {(shareId || explanation.share_id) && (
            <Link
              href={`/share/${shareId || explanation.share_id}`}
              className="text-xs text-accent hover:underline underline-offset-2 py-2"
            >
              배당표 보기
            </Link>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2 py-2 min-h-[44px] text-xs text-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {copied ? "복사됨" : "복사"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            className="px-2 py-2 min-h-[44px] text-xs text-accent cursor-pointer"
          >
            {expanded ? "접기" : "펼치기"}
          </button>
        </div>
      </div>

      <p className="mt-2 text-sm text-foreground whitespace-pre-line">
        {expanded ? text : preview}
      </p>
    </div>
  );
};
