import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const formData = new FormData();
  formData.append("secret", process.env.TURNSTILE_SECRET_KEY!);
  formData.append("response", token);

  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: formData,
    },
  );

  const data = await result.json();

  if (!data.success) {
    return NextResponse.json({ success: false }, { status: 403 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set("cf-verified", "true", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
