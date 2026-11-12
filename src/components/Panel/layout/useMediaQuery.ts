"use client";

import { useEffect, useState } from "react";

/**
 * Se a media query vale agora. No servidor e no primeiro render é `false`:
 * use para comportamento (folha no celular, popover no desktop), não para o
 * que precisa aparecer certo antes da hidratação.
 *
 * @example const isPhone = useMediaQuery("(max-width: 700px)");
 */
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const update = () => setMatches(mediaQuery.matches);

    update();
    mediaQuery.addEventListener("change", update);

    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
};
