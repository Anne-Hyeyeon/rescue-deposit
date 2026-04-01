"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export const useMobileMenu = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close on route change
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  return { isOpen, toggle, close };
};
