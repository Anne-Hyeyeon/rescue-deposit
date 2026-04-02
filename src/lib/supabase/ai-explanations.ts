import { createClient } from "./client";

export interface IAiExplanation {
  id: string;
  user_id: string;
  input_hash: string;
  explanation: string;
  share_id: string | null;
  created_at: string;
}

export const getExplanationByInputHash = async (
  userId: string,
  inputHash: string,
): Promise<IAiExplanation | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_explanations")
    .select("*")
    .eq("user_id", userId)
    .eq("input_hash", inputHash)
    .maybeSingle();

  if (error) {
    console.error("getExplanationByInputHash error:", error);
    return null;
  }

  return data;
};

export const getExplanationsByUserId = async (
  userId: string,
): Promise<IAiExplanation[]> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_explanations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getExplanationsByUserId error:", error);
    return [];
  }

  return data ?? [];
};

export const getExplanationByShareId = async (
  shareId: string,
): Promise<IAiExplanation | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ai_explanations")
    .select("*")
    .eq("share_id", shareId)
    .maybeSingle();

  if (error) {
    console.error("getExplanationByShareId error:", error);
    return null;
  }

  return data;
};

export const linkExplanationToShare = async (
  explanationId: string,
  shareId: string,
): Promise<void> => {
  const supabase = createClient();

  const { error } = await supabase
    .from("ai_explanations")
    .update({ share_id: shareId })
    .eq("id", explanationId);

  if (error) {
    console.error("linkExplanationToShare error:", error);
  }
};
