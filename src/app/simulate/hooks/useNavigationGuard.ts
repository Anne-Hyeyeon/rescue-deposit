"use client";

import { useEffect } from "react";

export const useNavigationGuard = (shouldBlock: boolean) => {
  useEffect(() => {
    if (!shouldBlock) return;

    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript")) return;

      // 외부 링크는 beforeunload가 처리
      if (anchor.target === "_blank") return;

      // 같은 페이지 내 앵커는 무시
      if (href.startsWith("/simulate") && !href.includes("/result")) return;

      const confirmed = window.confirm(
        "지금 나가면 입력한 내용이 사라집니다.\n계속 이동하시겠습니까?"
      );
      if (!confirmed) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [shouldBlock]);
};
