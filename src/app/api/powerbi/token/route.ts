import { NextResponse } from "next/server";
import {
  hasKey,
  getCachedPBI,
  addPBIToCache,
  removePBIfromCache,
  getPowerBIEmbededConfig,
} from "@/app/api/powerbi/token/services";

export async function GET(req: any) {
  try {
    const report_id = req.nextUrl.searchParams.get("reportID") || "";

    if (!report_id)
      return NextResponse.json(
        { error: "Report ID not provided" },
        { status: 400 },
      );

    let embededConfig = hasKey(report_id) ? getCachedPBI(report_id) : null;
    const isInvalidCached =
      !embededConfig || embededConfig.embed_expiration < new Date();

    if (isInvalidCached) {
      removePBIfromCache(report_id);
      embededConfig = await getPowerBIEmbededConfig(report_id);
      addPBIToCache(report_id, embededConfig);
    }

    return NextResponse.json(embededConfig, { status: 200 });
  } catch (error) {
    console.error("Error in handler:", error);
    return NextResponse.json(
      { error: "Error generating token" },
      { status: 500 },
    );
  }
}
