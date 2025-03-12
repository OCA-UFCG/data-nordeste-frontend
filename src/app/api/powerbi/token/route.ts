import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  hasKey,
  getCachedPBI,
  addPBIToCache,
  removePBIfromCache,
  getPowerBIEmbededConfig,
} from "@/app/api/powerbi/token/services";

export async function GET(req: NextRequest) {
  try {
    const report_id = req.nextUrl.searchParams.get("reportID") || "";

    if (!report_id)
      return NextResponse.json(
        { error: "Report ID not provided" },
        { status: 400 },
      );

    let embededConfig = hasKey(report_id) ? getCachedPBI(report_id) : null;
    const embedExpirationDate = embededConfig?.embed_expiration instanceof Date 
      ? embededConfig.embed_expiration 
      : new Date(embededConfig?.embed_expiration);

    if (!embededConfig || embedExpirationDate < new Date()) {
      removePBIfromCache(report_id);
      embededConfig = await getPowerBIEmbededConfig(report_id);
      addPBIToCache(report_id, embededConfig);
    }

    return NextResponse.json(embededConfig, { status: 200 });
  } catch (error) {
    console.log(error);

    return NextResponse.json(
      { error: "Error generating token" },
      { status: 500 },
    );
  }
}
