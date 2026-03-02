import { createClient } from "./client";

export interface Profile {
  id: string;
  nickname: string | null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

export async function upsertProfile(fields: Partial<Profile> & { id: string }) {
  const supabase = createClient();
  return supabase.from("profiles").upsert({
    ...fields,
    updated_at: new Date().toISOString(),
  });
}
