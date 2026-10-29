"use client";

import { useId, useState } from "react";

export const CollapsibleText = ({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) => {
  const id = useId();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col items-start gap-1">
      <p
        id={id}
        className={`${className} ${expanded ? "" : "line-clamp-3 sm:line-clamp-none"}`}
      >
        {text}
      </p>
      <button
        type="button"
        aria-controls={id}
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
        className="min-h-11 text-sm font-medium text-green-900 underline underline-offset-4 sm:hidden"
      >
        {expanded ? "Ler menos" : "Ler mais"}
      </button>
    </div>
  );
};
