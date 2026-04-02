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

      if (anchor.target === "_blank") return;

      // 다운로드 링크 (엑셀 저장 등)는 페이지 이탈이 아님
      if (anchor.hasAttribute("download")) return;
      if (href.startsWith("blob:") || href.startsWith("data:")) return;

      // /simulate 내부 이동 허용 (결과 페이지 포함)
      if (href.startsWith("/simulate")) return;

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
