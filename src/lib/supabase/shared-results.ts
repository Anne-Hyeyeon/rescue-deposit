import { createClient } from "./client";
import type { ISimulationInput, ISimulationResult } from "@/types/simulation";

export interface ISharedResult {
  id: string;
  share_id: string;
  user_id: string;
  title: string;
  input: ISimulationInput;
  result: ISimulationResult;
  show_my_info: boolean;
  show_ai_explanation?: boolean;
  ai_explanation_text?: string;
  created_at: string;
}

export async function createSharedResult(fields: {
  share_id: string;
  user_id: string;
  title: string;
  input: ISimulationInput;
  result: ISimulationResult;
  show_my_info: boolean;
  show_ai_explanation?: boolean;
  ai_explanation_text?: string;
}): Promise<ISharedResult> {
  const supabase = createClient();

  // DB에 없을 수 있는 컬럼 분리
  const { show_ai_explanation, ai_explanation_text, ...coreFields } = fields;
  const insertData: Record<string, unknown> = { ...coreFields };
  if (show_ai_explanation !== undefined) insertData.show_ai_explanation = show_ai_explanation;
  if (ai_explanation_text) insertData.ai_explanation_text = ai_explanation_text;

  const { data, error } = await supabase
    .from("shared_results")
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSharedResultByShareId(
  shareId: string,
): Promise<ISharedResult | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_results")
    .select("*")
    .eq("share_id", shareId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function getSharedResultsByUserId(
  userId: string,
): Promise<ISharedResult[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shared_results")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteSharedResult(
  id: string,
  userId: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shared_results")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
