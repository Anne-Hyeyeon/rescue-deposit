import { useState, useCallback, useRef, useEffect } from "react";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";
import { computeInputHash } from "@/lib/utils/input-hash";
import { getExplanationByInputHash } from "@/lib/supabase/ai-explanations";
import { isDemoInput, DEMO_EXPLANATION_TEXT } from "@/app/simulate/constants/demo-explanation";
import { useAuthStore } from "@/store/useAuthStore";

// 상수
const TYPING_CHARS_PER_TICK = 3;
const TYPING_INTERVAL_MS = 15;
const MIN_VALID_RESPONSE_LENGTH = 50;

interface IAiContent {
  greeting: string;
  table: string;
}

const EMPTY_CONTENT: IAiContent = { greeting: "", table: "" };

const stripMarkdown = (text: string): string =>
  text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/`([^`]+)`/g, "$1");

const parseContent = (text: string): IAiContent => {
  const tableOpen = "[TABLE]";
  const tableClose = "[/TABLE]";
  const tableStart = text.indexOf(tableOpen);

  const greeting =
    tableStart === -1
      ? stripMarkdown(text.trim())
      : stripMarkdown(text.slice(0, tableStart).trim());

  let table = "";
  if (tableStart !== -1) {
    const contentStart = tableStart + tableOpen.length;
    const endIdx = text.indexOf(tableClose, contentStart);
    const raw =
      endIdx === -1
        ? text.slice(contentStart).trim()
        : text.slice(contentStart, endIdx).trim();
    table = stripMarkdown(raw);
  }

  return { greeting, table };
};

const combineContent = (c: IAiContent): string =>
  c.greeting && c.table
    ? `${c.greeting}\n\n${c.table}`
    : c.greeting || c.table;

export const useAiExplanation = () => {
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState<IAiContent>(EMPTY_CONTENT);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputHash, setInputHash] = useState<string | null>(null);
  const [explanationId, setExplanationId] = useState<string | null>(null);
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // 언마운트 시 interval + fetch 정리
  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const showWithTyping = useCallback((fullText: string) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setIsTyping(true);
    let idx = 0;
    const parsed = parseContent(fullText);
    const combined = combineContent(parsed);

    typingRef.current = setInterval(() => {
      idx += TYPING_CHARS_PER_TICK;
      const partial = combined.slice(0, idx);
      setContent({ greeting: "", table: partial });

      if (idx >= combined.length) {
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = null;
        setContent(parsed);
        setIsTyping(false);
      }
    }, TYPING_INTERVAL_MS);
  }, []);

  const loadSaved = useCallback(
    async (input: ISimulationInput) => {
      if (isDemoInput(input.salePrice, input.mortgageMaxClaim, input.mortgageRegDate)) {
        setIsDemo(true);
        return null;
      }

      if (!user) return null;

      const hash = await computeInputHash(input);
      setInputHash(hash);

      const saved = await getExplanationByInputHash(user.id, hash);
      if (saved) {
        setContent(parseContent(saved.explanation));
        setIsPersisted(true);
        setExplanationId(saved.id);
        return saved;
      }

      return null;
    },
    [user],
  );

  const trigger = useCallback(
    async (input: ISimulationInput, result: ISimulationResult, remainingCredits: number) => {
      setError(null);

      // 데모
      if (isDemoInput(input.salePrice, input.mortgageMaxClaim, input.mortgageRegDate)) {
        setIsDemo(true);
        setIsPersisted(true);
        showWithTyping(DEMO_EXPLANATION_TEXT);
        return;
      }

      // 이미 저장된 해설
      if (isPersisted && content.table) return;

      // 크레딧 확인
      if (remainingCredits <= 0) {
        setError("무료 크레딧이 소진되었습니다. 유료 버전은 오픈 예정입니다.");
        return;
      }

      // 이전 요청 취소
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);
      setContent(EMPTY_CONTENT);

      const hash = inputHash ?? (await computeInputHash(input));
      setInputHash(hash);

      try {
        const res = await fetch("/api/ai-explanation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input, result }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || `Error ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullText += decoder.decode(value, { stream: true });
          setContent(parseContent(fullText));
        }

        setContent(parseContent(fullText));

        // 정상 답변만 저장 + 크레딧 차감
        if (fullText.trim().length > MIN_VALID_RESPONSE_LENGTH) {
          setIsPersisted(true);
          const saveRes = await fetch("/api/ai-explanation/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ inputHash: hash, explanation: fullText }),
          });
          if (saveRes.ok) {
            const saveData = await saveRes.json();
            if (saveData.explanationId) setExplanationId(saveData.explanationId);
          }
        } else {
          setError("AI 토큰이 부족합니다. 운영자에게 문의 부탁드립니다.");
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "";
        setError(
          msg.includes("credit balance")
            ? "AI 토큰이 부족합니다. 운영자에게 문의 부탁드립니다."
            : msg || "알 수 없는 오류",
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isPersisted, content.table, inputHash, showWithTyping],
  );

  const fullText = combineContent(content);

  return {
    content,
    fullText,
    isStreaming,
    isTyping,
    isPersisted,
    isDemo,
    error,
    inputHash,
    explanationId,
    trigger,
    loadSaved,
  };
};
