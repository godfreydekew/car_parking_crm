import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
  iconClassName?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconClassName,
}) => {
  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 sm:p-5 transition-all duration-200 hover:shadow-md animate-fade-in h-full flex flex-col",
        className
      )}
    >
      <div className="flex items-start justify-between flex-1">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-muted-foreground line-clamp-1">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-1 sm:mt-2 flex items-center gap-1">
              <span
                className={cn(
                  "text-xs font-medium",
                  trend.value >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-2 sm:p-2.5 rounded-lg bg-primary/10 flex-shrink-0 ml-2",
            iconClassName
          )}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
      </div>
    </div>
  );
};
