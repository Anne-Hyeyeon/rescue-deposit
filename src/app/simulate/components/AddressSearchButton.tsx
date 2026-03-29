"use client";

import { useDaumPostcodePopup } from "react-daum-postcode";

interface IAddressSearchButtonProps {
  onComplete: (data: { address: string; sido: string; sigungu: string }) => void;
}

export const AddressSearchButton = ({ onComplete }: IAddressSearchButtonProps) => {
  const open = useDaumPostcodePopup();

  const handleClick = () => {
    open({
      onComplete: (data) => {
        onComplete({
          address: data.address,
          sido: data.sido,
          sigungu: data.sigungu,
        });
      },
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-1.5 rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm font-medium text-foreground
        hover:border-accent hover:text-accent transition-colors duration-150 cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      aria-label="주소 검색"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      주소 검색
    </button>
  );
};
