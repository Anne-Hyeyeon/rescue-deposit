import { createClient } from "./client";

const DEFAULT_TOTAL_CREDITS = 1;

interface IUserCredits {
  total: number;
  used: number;
  remaining: number;
}

export const getUserCredits = async (
  userId: string,
): Promise<IUserCredits> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("user_credits")
    .select("total_credits, used_credits")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("getUserCredits query error:", error);
  }

  if (!data) {
    const { error: insertError } = await supabase
      .from("user_credits")
      .insert({ user_id: userId });

    if (insertError && insertError.code !== "23505") {
      console.error("getUserCredits insert error:", insertError);
    }

    return { total: DEFAULT_TOTAL_CREDITS, used: 0, remaining: DEFAULT_TOTAL_CREDITS };
  }

  return {
    total: data.total_credits,
    used: data.used_credits,
    remaining: data.total_credits - data.used_credits,
  };
};
