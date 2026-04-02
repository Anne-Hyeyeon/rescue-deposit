import { useEffect, useState, useCallback } from "react";
import { getUserCredits } from "@/lib/supabase/user-credits";
import { useAuthStore } from "@/store/useAuthStore";

const DEFAULT_TOTAL_CREDITS = 1;

interface IAiCreditsState {
  remaining: number;
  total: number;
  isLoading: boolean;
}

export const useAiCredits = () => {
  const user = useAuthStore((s) => s.user);
  const [state, setState] = useState<IAiCreditsState>({
    remaining: 0,
    total: DEFAULT_TOTAL_CREDITS,
    isLoading: true,
  });

  const loadCredits = useCallback(async () => {
    if (!user) {
      setState({ remaining: 0, total: DEFAULT_TOTAL_CREDITS, isLoading: false });
      return;
    }

    const credits = await getUserCredits(user.id);
    setState({
      remaining: credits.remaining,
      total: credits.total,
      isLoading: false,
    });
  }, [user]);

  useEffect(() => {
    loadCredits();
  }, [loadCredits]);

  const decrement = useCallback(() => {
    setState((prev) => ({
      ...prev,
      remaining: Math.max(0, prev.remaining - 1),
    }));
  }, []);

  return { ...state, decrement, refetch: loadCredits };
};
