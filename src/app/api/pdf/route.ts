import { NextRequest, NextResponse } from "next/server";

/**
 * Validates if the string is a valid HTTP/HTTPS URL.
 * @param urlString The URL to check
 * @returns boolean
 */
function isValidUrl(urlString: string): boolean {
  return urlString.startsWith("http://") || urlString.startsWith("https://");
}

/**
 * Fetches the external PDF content from the specified URL with a timeout.
 * @param url The external PDF URL
 * @returns Promise<Response>
 */
async function fetchPdf(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * API route to proxy external PDFs to bypass X-Frame-Options and CORS limitations.
 * Usage: GET /api/pdf?url=https%3A%2F%2Fexample.com%2Fdocument.pdf
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pdfUrl = searchParams.get("url");

  if (!pdfUrl || !isValidUrl(pdfUrl)) {
    const msg = !pdfUrl ? "Missing url parameter" : "Invalid URL protocol";

    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    const response = await fetchPdf(pdfUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.statusText}` },
        { status: response.status },
      );
    }

    const pdfBuffer = await response.arrayBuffer();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
