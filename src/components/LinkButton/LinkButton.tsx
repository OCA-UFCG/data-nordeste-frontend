import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <Button
      asChild
      variant={disabled ? "ghost" : variant}
      disabled={disabled}
      className={cn(
        "w-full md:w-auto",
        disabled && "cursor-not-allowed pointer-events-none",
        className,
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};
