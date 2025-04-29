import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ReactNode } from "react";

export const LinkButton = ({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  return (
    <Button
      asChild
      variant={variant}
      className={`w-full md:w-auto ${className}`}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );
};
