"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

function getHomeSections(): HTMLElement[] {
  const root = document.getElementById("root");

  if (!root) return [];

  return Array.from(root.children).filter(
    (node): node is HTMLElement =>
      node instanceof HTMLElement && !node.dataset.homeScrollButton,
  );
}

function getNextSection(sections: HTMLElement[]): HTMLElement | undefined {
  const targetY = window.scrollY + window.innerHeight * 0.55;

  return sections.find((section: HTMLElement) => {
    const sectionTop = section.getBoundingClientRect().top + window.scrollY;

    return sectionTop > targetY;
  });
}

function scrollToNextHomeSection(): void {
  const nextSection = getNextSection(getHomeSections());

  if (!nextSection) {
    window.scrollBy({ top: window.innerHeight * 0.7, behavior: "smooth" });

    return;
  }

  nextSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useFooterVisibility(): boolean {
  const [isFooterVisible, setIsFooterVisible] = useState<boolean>(false);

  useEffect(() => {
    const footer = document.querySelector("footer");

    if (!(footer instanceof HTMLElement)) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsFooterVisible(entry.isIntersecting);
    });

    observer.observe(footer);

    return () => observer.disconnect();
  }, []);

  return isFooterVisible;
}

/**
 * Adds home-only section navigation while keeping the footer reachable.
 * @example
 * <HomeScrollButton />
 */
export function HomeScrollButton() {
  const isFooterVisible = useFooterVisibility();

  if (isFooterVisible) return null;

  return (
    <button
      type="button"
      data-home-scroll-button="true"
      aria-label="Ir para a próxima seção"
      onClick={scrollToNextHomeSection}
      className="fixed bottom-6 right-6 z-40 flex h-[72px] w-[72px] cursor-pointer items-center justify-center gap-2 rounded-full bg-green-800 p-3 shadow-lg transition duration-200 hover:scale-105 hover:bg-green-900 active:scale-95 active:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
    >
      <ChevronDown aria-hidden="true" className="h-12 w-12 text-white" />
    </button>
  );
}
