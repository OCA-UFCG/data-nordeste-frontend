"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { ProtoIcon } from "@/components/ProtoPanel/ProtoIcon";
import { cn } from "@/lib/utils";

// Veio de outra página do portal: volta para ela. Sem histórico do portal
// (link aberto direto), o href leva a "Explorar dados".
const cameFromPortal = () =>
  !!document.referrer &&
  new URL(document.referrer).origin === window.location.origin;

/**
 * Botão "Voltar" da capa, na cor do texto da capa.
 * `className` dá a cor do anel de foco.
 *
 * @example <ProtoBackLink className="focus-visible:outline-white" />
 */
export const ProtoBackLink = ({ className }: { className: string }) => {
  const router = useRouter();
  const goBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!cameFromPortal()) return;
    event.preventDefault();
    router.back();
  };

  return (
    <Link
      href="/explore"
      onClick={goBack}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-[6px] py-1.5 pr-2 text-sm font-semibold text-inherit no-underline hover:underline hover:underline-offset-3 focus-visible:outline-[2.5px] focus-visible:outline-offset-2",
        className,
      )}
    >
      <ProtoIcon name="back" size={20} stroke={2.2} />
      Voltar
    </Link>
  );
};
