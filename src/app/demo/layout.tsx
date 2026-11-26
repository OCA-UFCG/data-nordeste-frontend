import { notFound } from "next/navigation";
import type { ReactNode } from "react";

// IMPORTANT: as demos vivem no gamma (André, 14/11/2026) e, desde 25/11/2026, no beta.
// DEMOS_HABILITADAS=1 em deploy-gamma.yml e deploy-beta.yml; prod não seta a flag
// e /demo/* responde 404 lá.
// Lida em runtime (não é NEXT_PUBLIC_): o gamma builda com NEXT_PUBLIC_APP_ENV=beta.
export const dynamic = "force-dynamic";

export default function DemoLayout({ children }: { children: ReactNode }) {
  if (process.env.DEMOS_HABILITADAS !== "1") notFound();

  return children;
}
