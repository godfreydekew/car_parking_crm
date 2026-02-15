import { PlaneTakeoff } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-10 w-10",
    lg: "h-14 w-14",
  };

  const containerClasses = {
    sm: "w-10 h-10",
    md: "w-16 h-16",
    lg: "w-20 h-20",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative">
        <div
          className={cn(
            "rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse",
            containerClasses[size]
          )}
        >
          <PlaneTakeoff
            className={cn("text-primary animate-bounce", sizeClasses[size])}
            style={{ animationDuration: "1.5s" }}
          />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
      </div>
      {message && (
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-20">
      {content}
    </div>
  );
}
