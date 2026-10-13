import { NextResponse } from "next/server";
import { resolvePdfDownloadUrl } from "@/features/boletim/pdfSource";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  try {
    const response = await fetch(resolvePdfDownloadUrl(targetUrl));

    if (!response.ok) {
      return new NextResponse("Failed to fetch PDF", {
        status: response.status,
      });
    }

    const contentType = response.headers.get("Content-Type") ?? "";

    // An upstream HTML page passed through as 200 shows up as a pdf.js parse
    // error; a 502 names the real fault: the source stopped serving a PDF.
    if (!contentType.includes("application/pdf")) {
      return new NextResponse(
        `Upstream "${targetUrl}" returned "${contentType}"; expected application/pdf.`,
        { status: 502 },
      );
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Error fetching PDF", { status: 500 });
  }
}
