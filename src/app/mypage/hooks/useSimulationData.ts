"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSimulationDataList,
  upsertSimulationData,
  deleteSimulationData,
  type ISimulationData,
} from "@/lib/supabase/simulation-data";
import { parseSimulationExcel } from "@/lib/excel/parser";
import type { User } from "@supabase/supabase-js";

interface IStatusMessage {
  type: "error" | "success";
  text: string;
}

const MAX_FILE_SIZE = 3 * 1024 * 1024;

export const useSimulationData = (user: User | null) => {
  const [dataList, setDataList] = useState<ISimulationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<IStatusMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const list = await getSimulationDataList(userId);
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

  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: "error", text: "파일 크기가 3MB를 초과합니다." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const result = await parseSimulationExcel(file);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      await upsertSimulationData({
        user_id: user.id,
        title: result.title,
        data: result.data,
      });
      await loadData(user.id);
      setMessage({ type: "success", text: "데이터가 저장되었습니다." });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: "업로드 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [user, loadData]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleOverwrite = useCallback(async (item: ISimulationData, file: File) => {
    if (!user) return;
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: "error", text: "파일 크기가 3MB를 초과합니다." });
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      const result = await parseSimulationExcel(file);
      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      await upsertSimulationData({
        id: item.id,
        user_id: user.id,
        title: result.title,
        data: result.data,
      });
      await loadData(user.id);
      setMessage({ type: "success", text: "데이터가 수정되었습니다." });
      setTimeout(() => setMessage(null), 2500);
    } catch {
      setMessage({ type: "error", text: "수정 중 오류가 발생했습니다." });
    } finally {
      setUploading(false);
    }
  }, [user, loadData]);

  const handleDelete = useCallback(async (id: string) => {
    if (!user) return;
    setDeletingId(id);
    try {
      await deleteSimulationData(id, user.id);
      await loadData(user.id);
    } catch {
      setMessage({ type: "error", text: "삭제 중 오류가 발생했습니다." });
    } finally {
      setDeletingId(null);
    }
  }, [user, loadData]);

  return {
    dataList,
    loading,
    uploading,
    message,
    deletingId,
    fileInputRef,
    handleFileChange,
    handleOverwrite,
    handleDelete,
  };
};
