import { Card } from "./Card";

export const AssumptionsBanner = () => (
  <Card className="border-yellow-200 bg-yellow-50/50 dark:border-card-border dark:bg-card-bg">
    <div className="flex items-start gap-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="mt-0.5 shrink-0 text-yellow-600 dark:text-yellow-500/80"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <div>
        <p className="mb-2 text-sm font-semibold text-yellow-800 dark:text-foreground">
          시뮬레이션 전제 조건
        </p>
        <ul className="space-y-1.5 text-xs leading-relaxed text-yellow-700 dark:text-sub-text">
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">&#8226;</span>
            <span>
              <strong>배당요구를 한 세입자만</strong> 계산에 포함됩니다.
              배당요구를 하지 않은 세입자는 배당 대상에서 제외됩니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">&#8226;</span>
            <span>
              대항력 발생일이 입력되면 <strong>대항력이 있는 것으로 가정</strong>합니다.
              경매개시결정 등기 전 대항요건 구비 여부는 별도로 검증하지 않습니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">&#8226;</span>
            <span>
              <strong>증액된 보증금은 반영되지 않습니다.</strong>
              계약 갱신 시 보증금이 올라간 경우 소액임차인 여부가 달라질 수 있으나
              이 시뮬레이터는 현재 입력된 보증금만으로 판단합니다.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <span className="mt-0.5 shrink-0">&#8226;</span>
            <span>
              이 결과는 <strong>참고용</strong>이며, 실제 배당 결과는 법원의 판단에 따라 달라질 수 있습니다.
            </span>
          </li>
        </ul>
      </div>
    </div>
  </Card>
);
