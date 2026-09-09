import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  subtitle,
  align = "center",
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn("mb-10", align === "center" ? "text-center" : "text-left", className)}>
      <h2 className="text-3xl sm:text-4xl font-bold">{title}</h2>
      {subtitle ? (
        <p className={cn("mt-3 text-muted-foreground", align === "center" && "mx-auto max-w-2xl")}>{subtitle}</p>
      ) : null}
    </div>
  );
}
