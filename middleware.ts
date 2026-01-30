import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  console.log("middleware rodou:", req.nextUrl.pathname);

  const verified = req.cookies.get("cf-verified")?.value;
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("api/verify")) {
    return NextResponse.next();
  }

  if (!verified) {
    const url = req.nextUrl.clone();
    url.pathname = "/verify";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
