import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return new NextResponse("URL is required", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);

    if (!response.ok) {
      return new NextResponse("Failed to fetch PDF", {
        status: response.status,
      });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/pdf",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Error fetching PDF", { status: 500 });
  }
}
