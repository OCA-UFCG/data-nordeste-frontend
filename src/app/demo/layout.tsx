import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// IMPORTANT: as demos vivem só no gamma (André, 14/11/2026). DEMOS_HABILITADAS=1 só
// no deploy-gamma.yml; beta e prod não setam a flag e /demo/* responde 404 lá.
// Lida em runtime (não é NEXT_PUBLIC_): o gamma builda com NEXT_PUBLIC_APP_ENV=beta.
export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: ReactNode }) {
  if (process.env.DEMOS_HABILITADAS !== "1") notFound();

  return children;
}
