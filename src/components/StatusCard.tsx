import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  status?: "safe" | "warning" | "danger" | "neutral";
  className?: string;
}

export const StatusCard = ({ icon, label, value, status = "neutral", className }: StatusCardProps) => {
  const statusColors = {
    safe: "border-success/30 bg-success/5",
    warning: "border-warning/30 bg-warning/5",
    danger: "border-destructive/30 bg-destructive/5",
    neutral: "border-border bg-card",
  };

  const iconColors = {
    safe: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    neutral: "text-muted-foreground",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all duration-300 shadow-card",
        statusColors[status],
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-lg bg-secondary", iconColors[status])}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-sm font-semibold truncate">{value}</p>
        </div>
      </div>
    </div>
  );
};
