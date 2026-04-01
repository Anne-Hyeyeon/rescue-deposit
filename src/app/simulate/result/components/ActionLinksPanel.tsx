const ACTION_ITEMS = [
  {
    title: "배당요구종기일 확인 및 신청",
    desc: "법원 경매정보 사이트에서 해당 사건의 종기일을 확인하고 기간 내 배당요구 신청을 해야 합니다.",
    href: "https://www.courtauction.go.kr",
  },
  {
    title: "임차권등기명령 신청",
    desc: "이사를 가야 할 경우 대항력을 유지하기 위해 법원에 임차권등기명령을 신청하세요.",
    href: "https://www.iros.go.kr",
  },
  {
    title: "HUG 전세보증금반환보증 안내",
    desc: "HUG(주택도시보증공사) 전세사기 피해자 지원센터를 통해 추가 지원을 받을 수 있습니다.",
    href: "https://www.khug.or.kr",
  },
] as const;

export const ActionLinksPanel = () => (
  <div className="rounded-2xl border border-card-border bg-card-bg p-5">
    <h3 className="mb-3 text-sm font-semibold text-foreground">
      지금 해야 할 일
    </h3>
    <ul className="flex flex-col gap-1">
      {ACTION_ITEMS.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl p-3 transition-colors duration-150 hover:bg-hover-bg"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="mt-0.5 shrink-0 text-accent"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <div>
              <p className="text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-sub-text">
                {item.desc}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  </div>
);
