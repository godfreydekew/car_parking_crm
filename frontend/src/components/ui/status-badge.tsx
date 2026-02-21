import { cn } from "@/lib/utils";
import { BookingStatus } from "@/types/crm";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  BOOKED: {
    label: 'Booked',
    className: 'bg-primary/10 text-primary',
  },
  ON_SITE: {
    label: 'On Site',
    className: 'bg-success/10 text-success',
  },
  COLLECTED: {
    label: 'Collected',
    className: 'bg-muted text-muted-foreground',
  },
  OVERSTAY: {
    label: 'Overstay',
    className: 'bg-warning/10 text-warning',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive',
  },
  NO_SHOW: {
    label: 'No Show',
    className: 'bg-destructive/10 text-destructive',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide transition-colors",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
