import { createClient } from "./client";
import type { ISimulationInput } from "@/types/simulation";

export interface ISimulationData {
  id: string;
  user_id: string;
  title: string;
  data: ISimulationInput;
  created_at: string;
  updated_at: string;
}

export async function getSimulationDataList(
  userId: string
): Promise<ISimulationData[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulation_data")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getSimulationData(
  id: string,
  userId: string
): Promise<ISimulationData | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("simulation_data")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function upsertSimulationData(
  fields: {
    id?: string;
    user_id: string;
    title: string;
    data: ISimulationInput;
  }
): Promise<ISimulationData> {
  const supabase = createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("simulation_data")
    .upsert({
      ...fields,
      updated_at: now,
      ...(fields.id ? {} : { created_at: now }),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSimulationData(
  id: string,
  userId: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("simulation_data")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) throw error;
}
