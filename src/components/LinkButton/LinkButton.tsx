import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Icon } from "../Icon/Icon";

export const LinkButton = ({
  href,
  text,
  variant = "primary",
  className = "",
}: {
  href: string;
  text: string;
  variant?: "primary" | "secondary";
  className?: string;
}) => {
  return (
    <Button
      asChild
      variant={variant}
      className={`w-full md:w-auto ${className}`}
    >
      <Link href={href}>
        {text}
        {variant === "secondary" && (
          <Icon
            id="expand"
            className="transform -rotate-90 !w-[8px] !h-[8px]"
          />
        )}
      </Link>
    </Button>
  );
};
