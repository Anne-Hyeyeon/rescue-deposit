"use client";

import { downloadSimulationExcel } from "@/lib/excel/generator";
import { AssumptionsBanner } from "@/app/simulate/components/form-primitives";
import {
  MyTenantSection,
  OptionalSection,
  PropertySection,
  SalePriceSection,
} from "@/app/simulate/components/sections";
import { parsePropertyType, parseRegion } from "@/app/simulate/helpers";
import { useSimulationForm } from "@/app/simulate/hooks/useSimulationForm";
import { DEMO_CASES, VISIBLE_DEMO_KEYS, PROD_DEMO } from "@/app/simulate/constants/demo-cases";
import { DemoSourceButton, MyDataButton } from "@/app/simulate/components/DemoSourceButton";

export default function SimulatePage() {
  const form = useSimulationForm();

  if (form.isAuthLoading || !form.user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-10 pb-24">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          배당 시뮬레이터
        </h1>
        <p className="text-sm text-sub-text mt-2 leading-relaxed">
          경매 매각대금에서 내 보증금이 얼마나 돌아올 수 있는지 계산해 드려요.
          <br />
          입력 정보는 서버에 저장되지 않습니다.
        </p>

        {/* 내 데이터 + 데모 배너 */}
        <div className="mt-4 space-y-2">
          <MyDataButton
            isActive={form.activeSource === "my"}
            isLoading={form.loadingMyData}
            onClick={form.loadMyData}
          />
          <DemoSourceButton
            isActive={form.activeSource === "prod"}
            onClick={form.loadProdDemo}
            emoji={PROD_DEMO.emoji}
            title={PROD_DEMO.title}
            description={PROD_DEMO.description}
          />
          {VISIBLE_DEMO_KEYS.map((key) => (
            <DemoSourceButton
              key={key}
              isActive={form.activeSource === key}
              onClick={() => form.loadDemo(key)}
              emoji={DEMO_CASES[key].emoji}
              title={DEMO_CASES[key].title}
              description={DEMO_CASES[key].description}
            />
          ))}
        </div>
      </div>

      {/* 전제 조건 배너 */}
      <div className="mb-6">
        <AssumptionsBanner />
      </div>

      <form onSubmit={form.handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <SalePriceSection
            input={form.input}
            appraisalMode={form.appraisalMode}
            appraisalValue={form.appraisalValue}
            isSold={form.isSold}
            bidRateOption={form.bidRateOption}
            customBidRate={form.customBidRate}
            errors={form.errors}
            onAppraisalModeChange={(mode) => {
              form.setAppraisalMode(mode);
              form.setBidRateOption("none");
            }}
            onAppraisalValueChange={form.setAppraisalValue}
            onSoldStateChange={(value) => {
              form.setIsSold(value);
              form.setBidRateOption("none");
            }}
            onBidRateSelect={form.handleBidRateSelect}
            onCustomBidRateChange={form.handleCustomRateInput}
            onInputChange={(partial) => {
              if ("salePrice" in partial) {
                form.setBidRateOption("none");
              }
              form.setInput(partial);
            }}
          />

          <MyTenantSection
            input={form.input}
            errors={form.errors}
            onInputChange={form.setInput}
          />

          <PropertySection
            input={form.input}
            address={form.address}
            errors={form.errors}
            detectedRegionLabel={form.detectedRegionLabel}
            thresholdDepositMax={form.thresholdDepositMax}
            thresholdPriorityMax={form.thresholdPriorityMax}
            onAddressChange={form.setAddress}
            onAddressSearch={form.handleAddressSearch}
            onInputChange={form.setInput}
            onRegionChange={(value) => {
              const nextRegion = parseRegion(value);
              if (!nextRegion) return;
              form.setInput({ region: nextRegion });
            }}
            onPropertyTypeChange={(value) => {
              const nextPropertyType = parsePropertyType(value);
              if (!nextPropertyType) return;
              form.setInput({ propertyType: nextPropertyType });
            }}
          />

          <OptionalSection
            input={form.input}
            errors={form.errors}
            hasMyTenant={form.hasMyTenant}
            onInputChange={form.setInput}
            onAddOtherTenant={form.addOtherTenant}
            onUpdateOtherTenant={form.updateOtherTenant}
            onRemoveOtherTenant={form.removeOtherTenant}
          />

          {/* Submit + 전체 지우기 */}
          {form.confirmReset ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-error/30 bg-error-bg/50 py-5 px-4">
              <p className="text-sm font-medium text-foreground">입력한 정보를 모두 지울까요?</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={form.resetForm}
                  className="px-5 py-2 rounded-xl bg-error text-white text-sm font-medium hover:bg-error/80 transition-colors cursor-pointer"
                >
                  전체 지우기
                </button>
                <button
                  type="button"
                  onClick={() => form.setConfirmReset(false)}
                  className="px-5 py-2 rounded-xl border border-card-border text-sm text-sub-text hover:text-foreground transition-colors cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="submit"
                className="flex-1 py-4 rounded-2xl bg-accent-solid text-white font-semibold text-base
                  hover:opacity-90 active:scale-[0.98] transition-all duration-150
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40
                  cursor-pointer shadow-sm">
                배당액 계산하기
              </button>
              <button
                type="button"
                onClick={() => form.setConfirmReset(true)}
                className="px-4 py-4 rounded-2xl border border-card-border text-sub-text
                  hover:border-error/50 hover:text-error transition-colors duration-150
                  cursor-pointer"
                aria-label="전체 지우기"
                title="전체 지우기"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
            </div>
          )}

          {/* 엑셀로 저장 */}
          <button
            type="button"
            onClick={() => downloadSimulationExcel({ ...form.input, appraisalValue: form.appraisalValue })}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-card-border text-sm font-medium text-sub-text
              hover:border-foreground/40 hover:text-foreground transition-colors duration-150
              cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            입력 정보를 엑셀로 저장
          </button>
          <p className="text-center text-xs text-muted">
            저장한 엑셀은 <a href="/mypage" className="text-accent underline underline-offset-2 hover:opacity-80 transition-opacity">마이페이지</a>에서 업로드하면 양식 대신 바로 사용할 수 있어요.
          </p>
        </div>
      </form>
    </div>
  );
}
