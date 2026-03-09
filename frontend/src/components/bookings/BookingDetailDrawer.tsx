import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { Booking } from "@/types/crm";
import { useCRM } from "@/context/useCRM";
import {
  Car,
  CreditCard,
  Mail,
  Phone,
  Plane,
  Clock,
  FileText,
  CheckCircle2,
  LogIn,
  X,
  UserX,
  FileCheck,
  MessageSquarePlus,
  Loader2,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { BookingConfirmationDialog } from "./BookingConfirmationDialog";
import { InvoiceDialog } from "./InvoiceDialog";

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
  const { checkInBooking, collectBooking, updateBookingStatus, addBookingNote, getBookingById } = useCRM();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Reset note input when drawer closes
  useEffect(() => {
    if (!open) setNoteInput("");
  }, [open]);

  // Use fresh booking from context so activity/notes update after adding a note
  const displayBooking = booking ? (getBookingById(booking.id) ?? booking) : null;

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

  const handleCancel = async () => {
    try {
      await updateBookingStatus(booking.id, "CANCELLED");
      toast({
        title: "Booking cancelled",
        description: `${booking.fullName}'s booking has been cancelled.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNoShow = async () => {
    try {
      await updateBookingStatus(booking.id, "NO_SHOW");
      toast({
        title: "Marked as No Show",
        description: `${booking.fullName}'s booking has been marked as no show.`,
      });
      onClose();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update booking. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddNote = async () => {
    const trimmed = noteInput.trim();
    if (!trimmed || isAddingNote) return;

    setIsAddingNote(true);
    try {
      await addBookingNote(booking.id, trimmed);
      setNoteInput("");
      toast({
        title: "Note added",
        description: "Your note has been saved to this booking.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to add note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl">{displayBooking.fullName}</SheetTitle>
            <StatusBadge status={displayBooking.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Booking ID: {displayBooking.id}
          </p>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Quick Actions */}
          {displayBooking.status === "BOOKED" && (
            <div className="space-y-2">
              <Button onClick={handleCheckIn} className="w-full gap-2" size="sm">
                <LogIn className="h-4 w-4" />
                Mark Check-in
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  onClick={handleNoShow}
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                >
                  <UserX className="h-3.5 w-3.5" />
                  No Show
                </Button>
              </div>
            </div>
          )}
          {(displayBooking.status === "ON_SITE" || displayBooking.status === "OVERSTAY") && (
            <Button onClick={handleCollect} className="w-full gap-2" size="sm">
              <CheckCircle2 className="h-4 w-4" />
              Mark Collected
            </Button>
          )}

          {/* Confirmation Button */}
          <Button
            onClick={() => setConfirmationOpen(true)}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <FileCheck className="h-4 w-4" />
            Confirmation
          </Button>

          {/* Invoice Button */}
          <Button
            onClick={() => setInvoiceOpen(true)}
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            <FileText className="h-4 w-4" />
            Invoice
          </Button>

          <Separator />

          {/* Customer & Vehicle Card */}
          <div className="rounded-lg border bg-muted/20 overflow-hidden">
            {/* Customer header with name prominent */}
            <div className="px-3.5 py-3 border-b bg-muted/30">
              <p className="font-semibold text-sm">{displayBooking.fullName}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                {displayBooking.email && (
                  <a
                    href={`mailto:${displayBooking.email}`}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <Mail className="h-3 w-3" />
                    {displayBooking.email}
                  </a>
                )}
                <a
                  href={`tel:${displayBooking.whatsapp}`}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                >
                  <Phone className="h-3 w-3" />
                  {displayBooking.whatsapp}
                </a>
              </div>
            </div>

            {/* Vehicle section */}
            <div className="px-3.5 py-3 flex items-center gap-3">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {displayBooking.vehicleMake} {displayBooking.vehicleModel}
                  <span className="text-muted-foreground font-normal"> · {displayBooking.vehicleColor}</span>
                </p>
              </div>
              <div className="font-mono text-sm font-bold px-2.5 py-1 bg-background rounded border shrink-0">
                {displayBooking.registration}
              </div>
            </div>
          </div>

          <Separator />

          {/* Flight Details - compact grid */}
          <div className="space-y-2">
            <h3 className="section-label">
              Flight Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Plane className="h-3.5 w-3.5" />
                  <span className="text-[10px] uppercase font-medium">Drop-off</span>
                </div>
                <p className="text-sm font-medium">
                  {format(displayBooking.departureDate, "dd MMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">{displayBooking.departureTime}</p>
              </div>
              <div className="bg-muted/30 rounded-md p-2.5">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <Plane className="h-3.5 w-3.5 rotate-90" />
                  <span className="text-[10px] uppercase font-medium">Pick-up</span>
                </div>
                <p className="text-sm font-medium">
                  {format(displayBooking.arrivalDate, "dd MMM yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">{displayBooking.arrivalTime}</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-muted rounded font-medium inline-block">
              {displayBooking.flightType}
            </span>
          </div>

          <Separator />

          {/* Payment - inline */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{displayBooking.paymentMethod}</span>
            </div>
            <span className="text-lg font-semibold">R{displayBooking.cost}</span>
          </div>

          {displayBooking.specialInstructions && (
            <>
              <Separator />
              <div className="flex items-start gap-2 p-2.5 bg-warning/10 rounded-md border border-warning/20">
                <FileText className="h-3.5 w-3.5 text-warning mt-0.5 shrink-0" />
                <p className="text-xs">{displayBooking.specialInstructions}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Add Note */}
          <div className="space-y-2">
            <h3 className="section-label">
              Add Note
            </h3>
            <div className="space-y-2">
              <Textarea
                placeholder="Add a note to this booking..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="min-h-[60px] resize-none"
                disabled={isAddingNote}
              />
              <Button
                onClick={handleAddNote}
                disabled={!noteInput.trim() || isAddingNote}
                size="sm"
                className="w-full gap-2"
              >
                {isAddingNote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquarePlus className="h-4 w-4" />
                )}
                Add Note
              </Button>
            </div>
          </div>

          <Separator />

          {/* Activity Log - compact */}
          <div className="space-y-2">
            <h3 className="section-label">
              Activity Log
            </h3>
            <div className="space-y-2">
              {displayBooking.activity
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .map((event) => (
                  <div key={event.id} className="flex gap-2 text-xs">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{event.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {format(event.timestamp, "dd MMM yyyy, HH:mm")}
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

    <BookingConfirmationDialog
      booking={booking}
      open={confirmationOpen}
      onClose={() => setConfirmationOpen(false)}
    />

    <InvoiceDialog
      booking={booking}
      open={invoiceOpen}
      onClose={() => setInvoiceOpen(false)}
    />
    </>
  );
};
