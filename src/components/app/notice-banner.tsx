import { cn } from "@/lib/utils";

type NoticeBannerVariant = "default" | "error" | "warning";

const noticeBannerVariants: Record<NoticeBannerVariant, string> = {
  default: "text-muted-foreground",
  error: "border-destructive text-destructive",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

export function NoticeBanner({
  children,
  className,
  role = "alert",
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  role?: "alert" | "status";
  variant?: NoticeBannerVariant;
}) {
  return (
    <div role={role} className={cn("rounded-md border p-3 text-sm", noticeBannerVariants[variant], className)}>
      {children}
    </div>
  );
}
