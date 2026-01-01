import { cn } from "@/lib/utils";
import { BookingStatus } from "@/types/crm";

interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

const statusConfig: Record<BookingStatus, { label: string; className: string }> = {
  BOOKED: {
    label: 'Booked',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
  ON_SITE: {
    label: 'On Site',
    className: 'bg-success/10 text-success border-success/20',
  },
  COLLECTED: {
    label: 'Collected',
    className: 'bg-muted text-muted-foreground border-border',
  },
  OVERSTAY: {
    label: 'Overstay',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  NO_SHOW: {
    label: 'No Show',
    className: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
