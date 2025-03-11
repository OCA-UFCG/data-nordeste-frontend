import { NextResponse } from "next/server";
import {
  hasKey,
  getCachedPBI,
  addPBIToCache,
  getPowerBIEmbededConfig,
} from "@/app/api/powerbi/token/services";

export async function GET(req: any) {
  try {
    const report_id = req.nextUrl.searchParams.get("reportID") || "";
    if (hasKey(report_id)) {
      const embededConfig = getCachedPBI(report_id);
      const currentDate = new Date();
      const expirationDate = new Date(embededConfig.expiration);
      const isExpired = currentDate > expirationDate;

      if (!isExpired) return NextResponse.json(embededConfig, { status: 200 });
    }

    const embededConfig = await getPowerBIEmbededConfig(report_id);
    addPBIToCache(report_id, embededConfig);

    return NextResponse.json(embededConfig, { status: 200 });
  } catch (error) {
    console.error("Erro no handler:", error);
    return NextResponse.json({ error: "Erro ao gerar token" }, { status: 500 });
  }
}
