import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

export const LinkButton = ({
  href,
  children,
  variant = "primary",
  className = "",
  disabled = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  disabled?: boolean;
}) => {
  return (
    <div
      className={`w-full md:w-auto  ${disabled && "cursor-not-allowed"} ${className}`}
    >
      <Button
        asChild
        variant={disabled ? "ghost" : variant}
        disabled={disabled}
        className={`w-full ${disabled && "pointer-events-none"}`}
      >
        <Link href={href}>{children}</Link>
      </Button>
    </div>
  );
};
