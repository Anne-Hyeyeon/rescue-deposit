import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  tokens: number;
  created_at: string;
}

export type AuthUser = User;
