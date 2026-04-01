"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSharedResultsByUserId,
  deleteSharedResult,
  type ISharedResult,
} from "@/lib/supabase/shared-results";
import type { User } from "@supabase/supabase-js";

interface IStatusMessage {
  type: "error" | "success";
  text: string;
}

export const useSharedResults = (user: User | null) => {
  const [dataList, setDataList] = useState<ISharedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<IStatusMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const list = await getSharedResultsByUserId(userId);
      setDataList(list);
    } catch {
      setDataList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadData(user.id);
  }, [user, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await deleteSharedResult(id, user.id);
      await loadData(user.id);
    } catch {
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingId(null);
    }
  }, [user, loadData]);

  const handleCopyLink = useCallback(async (shareId: string) => {
    const url = `${window.location.origin}/share/${shareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setMessage({ type: "success", text: "링크가 복사되었습니다." });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: "복사에 실패했습니다. 직접 복사해주세요." });
    }
  }, []);

  return {
    dataList,
    loading,
    message,
    deletingId,
    handleDelete,
    handleCopyLink,
  };
};
