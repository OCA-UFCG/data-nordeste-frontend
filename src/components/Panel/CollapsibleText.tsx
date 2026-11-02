"use client";

import { type RefObject, useEffect, useId, useRef, useState } from "react";

// A fonte da web chega depois: com line-clamp-3 a caixa fica da mesma altura
// quando o texto passa de 3 para 4 linhas, e o ResizeObserver não dispara.
// O jsdom não tem document.fonts.
const onFontsReady = (callback: () => void) => {
  let active = true;

  document.fonts?.ready.then(() => {
    if (active) callback();
  });

  return () => {
    active = false;
  };
};

const watchClamp = (
  element: HTMLElement,
  onMeasure: (clamped: boolean) => void,
) => {
  const measure = () => onMeasure(element.scrollHeight > element.clientHeight);
  const observer = new ResizeObserver(measure);
  const stopFontsWait = onFontsReady(measure);

  measure();
  observer.observe(element);

  return () => {
    observer.disconnect();
    stopFontsWait();
  };
};

// Mede com o corte ativo (só no celular): texto que cabe em 3 linhas não ganha
// "Ler mais". Remede a cada mudança de tamanho (girar o celular), quando a
// fonte da web termina de carregar e quando o texto muda, o que mexe no
// scrollHeight sem mudar a caixa.
// Começa cortado, como o servidor renderiza: no caso comum, de texto longo, o
// botão já está lá e nada se move após a hidratação.
const useIsClamped = (
  ref: RefObject<HTMLParagraphElement | null>,
  expanded: boolean,
  text: string,
) => {
  const [clamped, setClamped] = useState(true);

  useEffect(() => {
    const element = ref.current;

    // Expandido, o corte some; vale a última medida para o "Ler menos" ficar.
    if (!element || expanded) return;

    return watchClamp(element, setClamped);
  }, [ref, expanded, text]);

  return clamped;
};

export const CollapsibleText = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const id = useId();
  const textRef = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const clamped = useIsClamped(textRef, expanded, text);

  return (
    <div className="flex flex-col items-start gap-1">
      <p
        id={id}
        ref={textRef}
        className={`${className} ${expanded ? "" : "line-clamp-3 sm:line-clamp-none"}`}
      >
        {text}
      </p>
      {expanded || clamped ? (
        <button
          type="button"
          aria-controls={id}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
          className="min-h-11 text-sm font-medium text-green-900 underline underline-offset-4 sm:hidden"
        >
          {expanded ? "Ler menos" : "Ler mais"}
        </button>
      ) : null}
    </div>
  );
};
