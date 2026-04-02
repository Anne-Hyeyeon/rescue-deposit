import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

const DEFAULT_TOTAL_CREDITS = 1;

interface ISaveRequestBody {
  inputHash: string;
  explanation: string;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as ISaveRequestBody;
  const { inputHash, explanation } = body;

  if (!inputHash || !explanation) {
    return new Response("Bad Request", { status: 400 });
  }

  // 이미 저장된 해설이 있으면 크레딧 미차감
  const { data: existing } = await supabase
    .from("ai_explanations")
    .select("id")
    .eq("user_id", user.id)
    .eq("input_hash", inputHash)
    .maybeSingle();

  if (existing) {
    return Response.json({ saved: true, alreadyExists: true, explanationId: existing.id });
  }

  // 크레딧 확인 + 없으면 생성 (upsert)
  const { data: credits, error: creditError } = await supabase
    .from("user_credits")
    .upsert(
      { user_id: user.id, total_credits: DEFAULT_TOTAL_CREDITS, used_credits: 0 },
      { onConflict: "user_id", ignoreDuplicates: true },
    )
    .select("total_credits, used_credits")
    .single();

  if (creditError || !credits) {
    // upsert 실패 시 기존 데이터 조회
    const { data: fallback } = await supabase
      .from("user_credits")
      .select("total_credits, used_credits")
      .eq("user_id", user.id)
      .single();

    if (!fallback) {
      return new Response("크레딧 정보를 불러올 수 없습니다.", { status: 500 });
    }

    if (fallback.used_credits >= fallback.total_credits) {
      return new Response("무료 크레딧이 소진되었습니다.", { status: 403 });
    }
  }

  const totalCredits = credits?.total_credits ?? DEFAULT_TOTAL_CREDITS;
  const usedCredits = credits?.used_credits ?? 0;

  if (usedCredits >= totalCredits) {
    return new Response("무료 크레딧이 소진되었습니다.", { status: 403 });
  }

  // 해설 저장 (UNIQUE 제약으로 중복 방지)
  const { data: inserted, error: insertError } = await supabase
    .from("ai_explanations")
    .insert({
      user_id: user.id,
      input_hash: inputHash,
      explanation,
    })
    .select("id")
    .single();

  if (insertError) {
    // UNIQUE 위반 = 동시 요청으로 이미 저장됨
    if (insertError.code === "23505") {
      return Response.json({ saved: true, alreadyExists: true });
    }
    console.error("Failed to save explanation:", insertError);
    return new Response("저장에 실패했습니다.", { status: 500 });
  }

  // 원자적 크레딧 차감: WHERE used_credits = 현재값 (낙관적 동시성 제어)
  const { data: updated, error: updateError } = await supabase
    .from("user_credits")
    .update({ used_credits: usedCredits + 1 })
    .eq("user_id", user.id)
    .eq("used_credits", usedCredits)
    .select("used_credits")
    .single();

  if (updateError || !updated) {
    // 동시 요청으로 차감 실패 시 해설은 유지 (이미 저장됨)
    console.error("Credit deduction conflict, explanation saved anyway");
  }

  return Response.json({
    saved: true,
    alreadyExists: false,
    explanationId: inserted?.id ?? null,
    remainingCredits: totalCredits - (updated?.used_credits ?? usedCredits + 1),
  });
}
