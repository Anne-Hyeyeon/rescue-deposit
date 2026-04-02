import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

export const useAiEligibility = () => {
  const user = useAuthStore((s) => s.user);
  const [isEligible, setIsEligible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const check = async () => {
    if (!user) {
      setIsEligible(false);
      setIsLoading(false);
      return;
    }

    const supabase = createClient();
    const { data } = await supabase
      .from("user_questionnaire_responses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    setIsEligible(!!data);
    setIsLoading(false);
  };

  useEffect(() => {
    check();
  }, [user]);

  const markEligible = () => setIsEligible(true);

  return { isEligible, isLoading, user, markEligible, recheck: check };
};
