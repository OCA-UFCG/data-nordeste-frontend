"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const returnTo = searchParams.get("returnTo") || "/";

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    script.async = true;
    script.onload = () => {
      window.turnstile.render(".cf-turnstile", {
        sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY! as string,
        callback: async (token: string) => {
          const res = await fetch("/api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });

          console.log("VERIFY STATUS:", res.status);

          if (res.ok) {
            router.replace(returnTo);
          }
        },
      });
    };

    document.body.appendChild(script);
  }, [returnTo, router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="cf-turnstile" />
    </div>
  );
}
