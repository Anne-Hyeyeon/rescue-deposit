import { useEffect, useState, useCallback } from "react";
import {
  getExplanationsByUserId,
  type IAiExplanation,
} from "@/lib/supabase/ai-explanations";
import { getUserCredits } from "@/lib/supabase/user-credits";
import type { User } from "@supabase/supabase-js";

interface IAiExplanationsState {
  explanations: IAiExplanation[];
  remainingCredits: number;
  totalCredits: number;
  isLoading: boolean;
}

export const useAiExplanations = (user: User | null) => {
  const [state, setState] = useState<IAiExplanationsState>({
    explanations: [],
    remainingCredits: 0,
    totalCredits: 3,
    isLoading: true,
  });

  const fetch = useCallback(async () => {
    if (!user) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const [explanations, credits] = await Promise.all([
      getExplanationsByUserId(user.id),
      getUserCredits(user.id),
    ]);

    setState({
      explanations,
      remainingCredits: credits.remaining,
      totalCredits: credits.total,
      isLoading: false,
    });
  }, [user]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
};
