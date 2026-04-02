"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/useAuthStore";

interface IQuestionnaireModalProps {
  onComplete: () => void;
  onClose: () => void;
}

const STAGES = [
  { id: "pre_expiry", label: "계약 만료 전 (보증금 미반환 인지 단계)" },
  { id: "post_expiry", label: "계약 만료 후 (임차권등기, 내용증명 등 조치 중)" },
  { id: "criminal", label: "형사 고소 진행 중 (사기죄 등)" },
  { id: "civil", label: "민사 소송 진행 중 (보증금 반환 청구)" },
  { id: "agent_lawsuit", label: "공인중개사 대상 손해배상 소송 중" },
  { id: "auction_before", label: "경매 개시됨, 매각기일 잡히기 전" },
  { id: "auction_done", label: "경매 완료 (낙찰), 배당기일 대기 중" },
  { id: "distribution_done", label: "배당 완료, 부족분 후속 조치 중" },
  { id: "all_done", label: "모든 법적 절차 종료" },
  { id: "other_stage", label: "기타" },
] as const;

const LANDLORD_STATUSES = [
  { id: "returned", label: "보증금 반환 완료 (일부 또는 전부)" },
  { id: "missing", label: "잠적 (연락 두절)" },
  { id: "reachable", label: "연락은 되나 보증금 미반환" },
  { id: "imprisoned", label: "구속/수감 중" },
  { id: "bankrupt", label: "파산 선고 또는 회생 절차 중" },
  { id: "fled", label: "해외 도피" },
  { id: "deceased", label: "사망" },
  { id: "other_landlord", label: "기타" },
] as const;

const RECOVERY_OPTIONS = [
  { id: "none", label: "없음, 한 푼도 못 받음" },
  { id: "partial_direct", label: "집주인에게 일부 직접 받음" },
  { id: "insurance", label: "전세보증보험으로 일부 받음" },
  { id: "subrogation", label: "대위변제(보험사 등)로 받음" },
  { id: "other_recovery", label: "기타" },
] as const;

const LIVING_STATUSES = [
  { id: "still_living", label: "해당 집에 계속 거주 중" },
  { id: "moved_registered", label: "이사했지만 전입 유지 중" },
  { id: "moved_unregistered", label: "이사 + 전입도 옮김" },
  { id: "unstable", label: "거주지 불안정 (임시 거처)" },
] as const;

const LEGAL_SUPPORTS = [
  { id: "lawyer", label: "변호사 선임함" },
  { id: "legal_aid", label: "법률구조공단/대한법률구조재단 이용 중" },
  { id: "victim_group", label: "피해자 대책위 소속" },
  { id: "special_law", label: "전세사기 특별법 피해자 결정 받음" },
  { id: "no_support", label: "아무 지원도 받지 못하고 있음" },
] as const;

const FUTURE_PLANS = [
  { id: "wait_distribution", label: "배당 결과를 보고 판단하려는 중" },
  { id: "legal_consult", label: "법률 상담을 받을 예정" },
  { id: "unjust_enrichment", label: "부당이득반환청구 검토 중" },
  { id: "join_group", label: "피해자 대책위 합류/활동 중" },
  { id: "special_law_apply", label: "특별법 피해자 결정 신청 예정" },
  { id: "settle_life", label: "이사/생활 안정이 급함" },
  { id: "not_sure", label: "아직 모르겠음" },
] as const;

const REFERRAL_SOURCES = [
  { id: "acquaintance", label: "지인 소개" },
  { id: "search", label: "검색 (네이버, 구글 등)" },
  { id: "community", label: "커뮤니티 (카페, 블로그)" },
  { id: "sns", label: "SNS (인스타그램, 유튜브 등)" },
  { id: "legal_consult", label: "법률 상담에서 알게 됨" },
  { id: "victim_group", label: "피해자 모임/대책위에서" },
  { id: "news", label: "뉴스/기사" },
  { id: "other_source", label: "기타" },
] as const;

type StageId = (typeof STAGES)[number]["id"];
type LandlordId = (typeof LANDLORD_STATUSES)[number]["id"];
type LegalSupportId = (typeof LEGAL_SUPPORTS)[number]["id"];
type FuturePlanId = (typeof FUTURE_PLANS)[number]["id"];

export const QuestionnaireModal = ({
  onComplete,
  onClose,
}: IQuestionnaireModalProps) => {
  const user = useAuthStore((s) => s.user);
  const [stages, setStages] = useState<Set<StageId>>(new Set());
  const [landlordStatuses, setLandlordStatuses] = useState<Set<LandlordId>>(new Set());
  const [recovery, setRecovery] = useState("");
  const [livingStatus, setLivingStatus] = useState("");
  const [legalSupports, setLegalSupports] = useState<Set<LegalSupportId>>(new Set());
  const [futurePlans, setFuturePlans] = useState<Set<FuturePlanId>>(new Set());
  const [referralSource, setReferralSource] = useState("");
  const [otherStage, setOtherStage] = useState("");
  const [otherLandlord, setOtherLandlord] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // 마운트 시 포커스
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  const isValid =
    stages.size > 0 &&
    landlordStatuses.size > 0 &&
    recovery !== "" &&
    livingStatus !== "" &&
    legalSupports.size > 0 &&
    futurePlans.size > 0 &&
    referralSource !== "";

  const toggleSet = <T extends string>(
    setter: React.Dispatch<React.SetStateAction<Set<T>>>,
    id: T,
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!user || !isValid) return;
    setIsSubmitting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("user_questionnaire_responses")
      .insert({
        user_id: user.id,
        responses: {
          stages: [...stages],
          other_stage: stages.has("other_stage") ? otherStage : undefined,
          landlord_statuses: [...landlordStatuses],
          other_landlord: landlordStatuses.has("other_landlord") ? otherLandlord : undefined,
          recovery,
          living_status: livingStatus,
          legal_supports: [...legalSupports],
          future_plans: [...futurePlans],
          referral_source: referralSource,
        },
      });

    setIsSubmitting(false);
    if (error) {
      setSubmitError("저장에 실패했습니다. 다시 시도해주세요.");
    } else {
      onComplete();
    }
  };

  const checkboxCls =
    "flex items-center gap-2.5 rounded-xl border border-card-border px-4 py-3 text-sm cursor-pointer transition-colors hover:border-accent/50";
  const checkboxActiveCls =
    "flex items-center gap-2.5 rounded-xl border-2 border-accent bg-accent/5 px-4 py-3 text-sm cursor-pointer";

  const renderMultiCheck = <T extends string>(
    items: ReadonlyArray<{ id: T; label: string }>,
    selected: Set<T>,
    toggle: (id: T) => void,
  ) => (
    <div className="flex flex-col gap-2">
      {items.map(({ id, label }) => (
        <label key={id} className={selected.has(id) ? checkboxActiveCls : checkboxCls}>
          <input
            type="checkbox"
            checked={selected.has(id)}
            onChange={() => toggle(id)}
            className="accent-accent"
          />
          {label}
        </label>
      ))}
    </div>
  );

  const renderRadio = (
    name: string,
    items: ReadonlyArray<{ id: string; label: string }>,
    value: string,
    onChange: (id: string) => void,
  ) => (
    <div className="flex flex-col gap-2">
      {items.map(({ id, label }) => (
        <label key={id} className={value === id ? checkboxActiveCls : checkboxCls}>
          <input
            type="radio"
            name={name}
            checked={value === id}
            onChange={() => onChange(id)}
            className="accent-accent"
          />
          {label}
        </label>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="questionnaire-title"
        tabIndex={-1}
        className="w-full max-w-lg max-h-[85dvh] overflow-y-auto rounded-2xl bg-background border border-card-border p-6 shadow-xl focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-2">
          <h2 id="questionnaire-title" className="text-lg font-bold text-foreground">
            AI 해설 이용을 위한 간단한 설문
          </h2>
          <p className="mt-1.5 text-sm text-sub-text">
            본 설문은 플랫폼 개선을 위해 활용되며, 개인을 식별할 수 있는 정보는 수집하지 않습니다.
          </p>
        </div>

        <div className="flex flex-col gap-7 mt-6">
          {/* Q1: 현재 단계 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              1. 현재 어떤 단계에 있으신가요? (복수 선택)
            </legend>
            {renderMultiCheck(STAGES, stages, (id) => toggleSet(setStages, id))}
            {stages.has("other_stage") && (
              <input
                type="text"
                value={otherStage}
                onChange={(e) => setOtherStage(e.target.value)}
                placeholder="직접 입력"
                aria-label="기타 단계 직접 입력"
                maxLength={50}
                className="mt-2 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
              />
            )}
          </fieldset>

          {/* Q2: 집주인 상태 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              2. 집주인(임대인) 현재 상태는? (복수 선택)
            </legend>
            {renderMultiCheck(LANDLORD_STATUSES, landlordStatuses, (id) => toggleSet(setLandlordStatuses, id))}
            {landlordStatuses.has("other_landlord") && (
              <input
                type="text"
                value={otherLandlord}
                onChange={(e) => setOtherLandlord(e.target.value)}
                placeholder="직접 입력"
                aria-label="기타 임대인 상태 직접 입력"
                maxLength={50}
                className="mt-2 w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm focus:outline-none focus:border-accent/50"
              />
            )}
          </fieldset>

          {/* Q3: 보증금 회수 여부 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              3. 보증금을 일부라도 회수한 적이 있나요?
            </legend>
            {renderRadio("recovery", RECOVERY_OPTIONS, recovery, setRecovery)}
          </fieldset>

          {/* Q4: 현재 거주 상황 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              4. 현재 거주 상황은 어떻게 되시나요?
            </legend>
            {renderRadio("livingStatus", LIVING_STATUSES, livingStatus, setLivingStatus)}
          </fieldset>

          {/* Q5: 법률 지원 현황 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              5. 현재 받고 계신 법적 지원이 있나요? (복수 선택)
            </legend>
            {renderMultiCheck(LEGAL_SUPPORTS, legalSupports, (id) => toggleSet(setLegalSupports, id))}
          </fieldset>

          {/* Q6: 앞으로의 계획 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              6. 보증금 회수를 위해 앞으로의 계획은? (복수 선택)
            </legend>
            {renderMultiCheck(FUTURE_PLANS, futurePlans, (id) => toggleSet(setFuturePlans, id))}
          </fieldset>

          {/* Q7: 알게 된 경로 */}
          <fieldset>
            <legend className="mb-2.5 text-sm font-semibold text-foreground">
              7. 절대지켜를 어떻게 알게 되셨나요?
            </legend>
            {renderRadio("referralSource", REFERRAL_SOURCES, referralSource, setReferralSource)}
          </fieldset>
        </div>

        <div className="sticky bottom-0 bg-background pt-4 pb-1 border-t border-card-border mt-8 -mx-6 px-6">
          {submitError && (
            <p className="mb-2 text-xs text-error" role="alert">{submitError}</p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-card-border py-3 text-sm text-sub-text transition-colors hover:border-foreground/30 cursor-pointer"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting ? "저장 중..." : "완료하고 AI 해설 보기"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
