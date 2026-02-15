import { useState, useEffect } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Booking, PaymentMethod, BookingStatus } from "@/types/crm";
import { useCRM } from "@/context/useCRM";
import { toast } from "@/hooks/use-toast";
import { Download, Eye, Loader2, FileCheck, Car, Plane, Calendar } from "lucide-react";

interface BookingConfirmationDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
}

export const BookingConfirmationDialog: React.FC<BookingConfirmationDialogProps> = ({
  booking,
  open,
  onClose,
}) => {
  const { updateBooking } = useCRM();
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [cost, setCost] = useState(0);
  const [status, setStatus] = useState<BookingStatus>("BOOKED");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);

  useEffect(() => {
    if (booking) {
      setPickupDate(format(booking.arrivalDate, "yyyy-MM-dd"));
      setPickupTime(booking.arrivalTime || "");
      setPaymentMethod(booking.paymentMethod);
      setSpecialInstructions(booking.specialInstructions || "");
      setCost(booking.cost);
      setStatus(booking.status);
      setGeneratedPdf(null);
    }
  }, [booking]);

  if (!booking) return null;

  const hasChanges = () => {
    return (
      pickupDate !== format(booking.arrivalDate, "yyyy-MM-dd") ||
      pickupTime !== (booking.arrivalTime || "") ||
      paymentMethod !== booking.paymentMethod ||
      specialInstructions !== (booking.specialInstructions || "") ||
      cost !== booking.cost ||
      status !== booking.status
    );
  };

  const generatePdf = (b: Booking): jsPDF => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    // Colors
    const primaryGreen = [30, 120, 70] as const;
    const darkText = [33, 33, 33] as const;
    const mutedText = [120, 120, 120] as const;
    const lightBg = [245, 247, 245] as const;

    // Header bar
    doc.setFillColor(...primaryGreen);
    doc.rect(0, 0, pageWidth, 40, "F");

    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("OR Tambo Premium Parking", margin, 18);

    // Document title
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Booking Confirmation", margin, 30);

    // Date on the right
    doc.setFontSize(9);
    doc.text(format(new Date(), "dd MMMM yyyy"), pageWidth - margin, 30, { align: "right" });

    let y = 55;

    // Company details section
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.setFont("helvetica", "normal");
    doc.text("From:", margin, y);
    y += 5;
    doc.setTextColor(...darkText);
    doc.setFontSize(9);
    doc.text("OR Tambo Airport, Kempton Park", margin, y);
    y += 4.5;
    doc.text("+27 73 544 0774", margin, y);
    y += 4.5;
    doc.text("info@ortambopremiumparking.co.za", margin, y);
    y += 4.5;
    doc.text("www.ortambopremiumparking.co.za", margin, y);

    y += 12;

    // Divider line
    doc.setDrawColor(...primaryGreen);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);

    y += 10;

    // Customer details
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Customer Details", margin, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);

    const drawField = (label: string, value: string, yPos: number) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...mutedText);
      doc.text(label, margin, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkText);
      doc.text(value, margin + 50, yPos);
      return yPos + 6;
    };

    y = drawField("Name", b.fullName, y);
    y = drawField("Email", b.email, y);
    y = drawField("WhatsApp", b.whatsapp, y);

    y += 6;

    // Vehicle details
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Vehicle Details", margin, y);
    y += 8;
    doc.setFontSize(9);

    y = drawField("Vehicle", `${b.vehicleMake} ${b.vehicleModel} (${b.vehicleColor})`, y);
    y = drawField("Registration", b.registration, y);

    y += 6;

    // Booking details table
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Booking Details", margin, y);
    y += 8;

    // Table background
    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y - 3, contentWidth, 42, 2, 2, "F");

    doc.setFontSize(9);
    const tableX = margin + 5;
    const tableValX = margin + 55;

    const drawTableRow = (label: string, value: string, yPos: number) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...mutedText);
      doc.text(label, tableX, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkText);
      doc.text(value, tableValX, yPos);
      return yPos + 7;
    };

    y = drawTableRow("Drop-off Date", format(b.departureDate, "dd/MM/yyyy"), y + 2);
    y = drawTableRow("Drop-off Time", b.departureTime, y);
    y = drawTableRow("Pick-up Date", pickupDate ? format(new Date(pickupDate + "T00:00:00"), "dd/MM/yyyy") : format(b.arrivalDate, "dd/MM/yyyy"), y);
    y = drawTableRow("Pick-up Time", pickupTime || "TBC", y);
    y = drawTableRow("Flight Type", b.flightType, y);

    y += 8;

    // Payment section
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Payment", margin, y);
    y += 8;
    doc.setFontSize(9);

    y = drawField("Payment Method", paymentMethod, y);

    // Cost - highlighted
    doc.setFillColor(...primaryGreen);
    doc.roundedRect(margin, y - 3, contentWidth, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Parking Total Cost", margin + 5, y + 3);
    doc.text(`R${cost}`, pageWidth - margin - 5, y + 3, { align: "right" });

    y += 16;

    // Special instructions
    if (specialInstructions) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryGreen);
      doc.text("Special Instructions", margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkText);
      const lines = doc.splitTextToSize(specialInstructions, contentWidth);
      doc.text(lines, margin, y);
      y += lines.length * 5 + 6;
    }

    // Booking ID
    doc.setDrawColor(...primaryGreen);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...darkText);
    doc.text(`Booking ID: ${b.id.toUpperCase()}`, margin, y);

    y += 12;

    // Footer
    doc.setFillColor(...primaryGreen);
    doc.rect(0, 280, pageWidth, 17, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("24/7 Customer Support", pageWidth / 2, 289, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("+27 73 544 0774  |  info@ortambopremiumparking.co.za", pageWidth / 2, 294, { align: "center" });

    return doc;
  };

  const handleGenerate = async () => {
    if (!booking) return;
    setIsGenerating(true);

    try {
      // Update backend if changes were made
      if (hasChanges()) {
        await updateBooking(booking.id, {
          pickup_at: pickupDate && pickupTime ? new Date(`${pickupDate}T${pickupTime}`).toISOString() : pickupDate ? new Date(`${pickupDate}T00:00:00`).toISOString() : undefined,
          payment_method: paymentMethod.toLowerCase(),
          special_instructions: specialInstructions,
          cost,
          status,
        });
      }

      // Generate PDF with current form values
      const doc = generatePdf(booking);
      setGeneratedPdf(doc);

      toast({
        title: "Confirmation generated",
        description: "PDF is ready to download or share.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate confirmation",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdf || !booking) return;
    const filename = `OR_Tambo_Parking_Confirmation_${booking.id.toUpperCase()}.pdf`;
    generatedPdf.save(filename);
  };

  const getWhatsAppUrl = (phone: string): string => {
    let cleaned = phone.replace(/\s+/g, "").replace(/[^0-9+]/g, "");
    // Remove leading +
    if (cleaned.startsWith("+")) cleaned = cleaned.substring(1);
    // If 9 digits, prepend 27
    if (cleaned.length === 9) cleaned = "27" + cleaned;
    // Remove leading 0 and prepend 27
    if (cleaned.startsWith("0") && cleaned.length === 10) cleaned = "27" + cleaned.substring(1);

    const message = encodeURIComponent(
      `Hi ${booking?.fullName}, here is your OR Tambo Premium Parking booking confirmation.\n\nBooking ID: ${booking?.id.toUpperCase()}\nDrop-off: ${booking ? format(booking.departureDate, "dd MMM yyyy") : ""} at ${booking?.departureTime}\nPick-up: ${pickupDate ? format(new Date(pickupDate + "T00:00:00"), "dd MMM yyyy") : (booking ? format(booking.arrivalDate, "dd MMM yyyy") : "")} at ${pickupTime || "TBC"}\nVehicle: ${booking?.registration}\nTotal: R${cost}\n\nThank you for choosing OR Tambo Premium Parking!\n+27 73 544 0774`
    );

    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const handleWhatsApp = () => {
    if (!booking) return;
    const url = getWhatsAppUrl(booking.whatsapp);
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Booking Confirmation
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Booking ID: {booking.id.toUpperCase()} — {booking.fullName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Read-only summary */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{booking.vehicleMake} {booking.vehicleModel} ({booking.vehicleColor}) — {booking.registration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>Drop-off on {format(booking.departureDate, "dd MMM yyyy")} at {booking.departureTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-muted-foreground shrink-0 rotate-90" />
              <span>Pick-up on {format(booking.arrivalDate, "dd MMM yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{booking.flightType === "DOMESTIC" ? "Domestic" : "International"} flight</span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pickupDate">Pick-up Date</Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pickupTime">Pick-up Time</Label>
                <Input
                  id="pickupTime"
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="EFT">EFT</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Cost (R)</Label>
                <Input
                  id="cost"
                  type="number"
                  min={0}
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOKED">Booked</SelectItem>
                  <SelectItem value="ON_SITE">On Site</SelectItem>
                  <SelectItem value="COLLECTED">Collected</SelectItem>
                  <SelectItem value="OVERSTAY">Overstay</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialInstructions">Special Instructions</Label>
              <Textarea
                id="specialInstructions"
                placeholder="Any special instructions..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {!generatedPdf ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileCheck className="h-4 w-4" />
              )}
              Generate Confirmation
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="text-sm text-center text-muted-foreground">
                ✓ Confirmation generated successfully
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownload} variant="outline" className="flex-1 gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => {
                    if (generatedPdf) {
                      const pdfBlob = generatedPdf.output("blob");
                      const url = URL.createObjectURL(pdfBlob);
                      window.open(url, "_blank");
                    }
                  }}
                  className="flex-1 gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </div>
              <Button
                onClick={() => setGeneratedPdf(null)}
                variant="ghost"
                size="sm"
                className="text-xs"
              >
                Regenerate
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
