import { format } from "date-fns";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Booking } from "@/types/crm";
import { useCRM } from "@/context/CRMContext";
import { 
  Car, 
  Calendar, 
  CreditCard, 
  Mail, 
  MessageCircle, 
  Phone,
  Plane,
  Clock,
  FileText,
  CheckCircle2,
  LogIn,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";

interface BookingDetailDrawerProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
}

export const BookingDetailDrawer: React.FC<BookingDetailDrawerProps> = ({
  booking,
  open,
  onClose,
}) => {
  const { checkInBooking, collectBooking } = useCRM();

  if (!booking) return null;

  const handleCheckIn = () => {
    checkInBooking(booking.id);
    toast({
      title: "Check-in successful",
      description: `${booking.fullName}'s vehicle has been checked in.`,
    });
  };

  const handleCollect = () => {
    collectBooking(booking.id);
    toast({
      title: "Collection recorded",
      description: `${booking.fullName} has collected their vehicle.`,
    });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{booking.fullName}</SheetTitle>
            <StatusBadge status={booking.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Booking ID: {booking.id.toUpperCase()}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick Actions */}
          {(booking.status === 'BOOKED' || booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
            <div className="flex gap-3">
              {booking.status === 'BOOKED' && (
                <Button onClick={handleCheckIn} className="flex-1 gap-2">
                  <LogIn className="h-4 w-4" />
                  Mark Check-in
                </Button>
              )}
              {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                <Button onClick={handleCollect} className="flex-1 gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Collected
                </Button>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Contact Information
            </h3>
            <div className="space-y-2">
              {booking.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{booking.whatsapp}</span>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </Button>
            </div>
          </div>

          <Separator />

          {/* Vehicle Info */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Vehicle Details
            </h3>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Car className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{booking.vehicleMake} {booking.vehicleModel}</p>
                  <p className="text-sm text-muted-foreground">{booking.vehicleColor}</p>
                </div>
              </div>
              <div className="text-lg font-mono font-bold text-center py-2 bg-background rounded border">
                {booking.registration}
              </div>
            </div>
          </div>

          <Separator />

          {/* Flight Info */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Flight Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plane className="h-4 w-4" />
                  <span className="text-xs uppercase">Departure</span>
                </div>
                <p className="font-medium">{format(booking.departureDate, 'dd MMM yyyy')}</p>
                <p className="text-sm text-muted-foreground">{booking.departureTime}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Plane className="h-4 w-4 rotate-90" />
                  <span className="text-xs uppercase">Arrival</span>
                </div>
                <p className="font-medium">{format(booking.arrivalDate, 'dd MMM yyyy')}</p>
                <p className="text-sm text-muted-foreground">{booking.arrivalTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-muted rounded font-medium">
                {booking.flightType}
              </span>
            </div>
          </div>

          <Separator />

          {/* Payment */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Payment
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{booking.paymentMethod}</span>
              </div>
              <span className="text-xl font-semibold">R{booking.cost}</span>
            </div>
          </div>

          {booking.specialInstructions && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Special Instructions
                </h3>
                <div className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <FileText className="h-4 w-4 text-warning mt-0.5" />
                  <p className="text-sm">{booking.specialInstructions}</p>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Activity Log */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Activity Log
            </h3>
            <div className="space-y-3">
              {booking.activity
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((event) => (
                  <div key={event.id} className="flex gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p>{event.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(event.timestamp, 'dd MMM yyyy, HH:mm')}
                        {event.user && ` • ${event.user}`}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
