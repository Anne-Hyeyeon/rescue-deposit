"use client";

import { useState, useEffect } from "react";
import { getProfile, upsertProfile } from "@/lib/supabase/profiles";
import type { User } from "@supabase/supabase-js";

interface INicknameMessage {
  type: "error" | "success";
  text: string;
}

const validateNickname = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "닉네임을 입력해주세요.";
  if (trimmed.length < 2) return "닉네임은 2자 이상이어야 합니다.";
  if (trimmed.length > 20) return "닉네임은 20자 이하여야 합니다.";
  if (!/^[a-zA-Z0-9가-힣_-]+$/.test(trimmed))
    return "영문, 숫자, 한글, _, - 만 사용할 수 있습니다.";
  return null;
};

export const useNickname = (user: User | null) => {
  const [nickname, setNickname] = useState("");
  const [savedNickname, setSavedNickname] = useState<string | null>(null);
  const [loadedProfileUserId, setLoadedProfileUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<INicknameMessage | null>(null);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    getProfile(user.id).then((profile) => {
      if (cancelled) return;
      const name =
        profile?.nickname ??
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        "";
      setNickname(name);
      setSavedNickname(name);
      setLoadedProfileUserId(user.id);
    });

    return () => { cancelled = true; };
  }, [user]);

  const profileLoading = user ? loadedProfileUserId !== user.id : false;

  const saveNickname = async () => {
    if (!user) return;
    const error = validateNickname(nickname);
    if (error) {
      setMessage({ type: "error", text: error });
      return;
    }
    setSaving(true);
    await upsertProfile({ id: user.id, nickname: nickname.trim() });
    setSavedNickname(nickname.trim());
    setSaving(false);
    setMessage({ type: "success", text: "닉네임이 저장되었습니다." });
    setTimeout(() => setMessage(null), 2000);
  };

  const handleNicknameChange = (value: string) => {
    setNickname(value);
    setMessage(null);
  };

  return {
    nickname,
    savedNickname,
    saving,
    message,
    profileLoading,
    saveNickname,
    handleNicknameChange,
  };
};
