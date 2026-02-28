import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  initialize: async () => {
    const supabase = createClient();

    // 현재 세션 복원
    const {
      data: { session },
    } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, isLoading: false });

    // 인증 상태 변경 감지
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ?? null });
    });
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
