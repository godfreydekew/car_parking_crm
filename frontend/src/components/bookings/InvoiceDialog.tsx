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
import { Booking } from "@/types/crm";
import { toast } from "@/hooks/use-toast";
import { Download, Eye, Loader2, Receipt, Car } from "lucide-react";

interface InvoiceDialogProps {
  booking: Booking | null;
  open: boolean;
  onClose: () => void;
}

export const InvoiceDialog: React.FC<InvoiceDialogProps> = ({
  booking,
  open,
  onClose,
}) => {
  const [invoiceDate, setInvoiceDate] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState(0);
  const [terms, setTerms] = useState("");
  const [bankName, setBankName] = useState("Access Bank");
  const [accountHolder, setAccountHolder] = useState("OR Tambo Premium Parking");
  const [branchCode, setBranchCode] = useState("410506");
  const [accountNumber, setAccountNumber] = useState("51303986128");
  const [reference, setReference] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdf, setGeneratedPdf] = useState<jsPDF | null>(null);

  useEffect(() => {
    if (booking) {
      setInvoiceDate(format(new Date(), "yyyy-MM-dd"));
      const days = Math.max(
        1,
        Math.ceil(
          (new Date(booking.arrivalDate).getTime() - new Date(booking.departureDate).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      );
      setDescription(
        `${days} Days Parking from ${format(booking.departureDate, "dd/MM/yy")} to ${format(booking.arrivalDate, "dd/MM/yy")}`
      );
      setTotalAmount(booking.cost);
      setReference(booking.registration);
      setTerms("");
      setGeneratedPdf(null);
    }
  }, [booking]);

  if (!booking) return null;

  const generatePdf = (): jsPDF => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2;

    const primaryGreen = [30, 120, 70] as const;
    const darkText = [33, 33, 33] as const;
    const mutedText = [120, 120, 120] as const;
    const lightBg = [245, 247, 245] as const;

    // Header bar
    doc.setFillColor(...primaryGreen);
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("OR Tambo Premium Parking", margin, 18);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("INVOICE", margin, 30);

    doc.setFontSize(9);
    doc.text(
      format(new Date(invoiceDate + "T00:00:00"), "dd MMMM yyyy"),
      pageWidth - margin,
      30,
      { align: "right" }
    );

    let y = 55;

    // From section
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
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

    doc.setDrawColor(...primaryGreen);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Bill To
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Bill To", margin, y);

    // Invoice date on the right
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedText);
    doc.text("Invoice Date:", pageWidth - margin - 40, y);
    doc.setTextColor(...darkText);
    doc.text(
      format(new Date(invoiceDate + "T00:00:00"), "dd/MM/yyyy"),
      pageWidth - margin,
      y,
      { align: "right" }
    );

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
      doc.text(value, margin + 35, yPos);
      return yPos + 6;
    };

    y = drawField("Name", booking.fullName, y);
    y = drawField("Email", booking.email, y);
    y = drawField("Phone", booking.whatsapp, y);
    y = drawField("Vehicle", `${booking.vehicleMake} ${booking.vehicleModel} (${booking.vehicleColor})`, y);

    y += 8;

    // Description table
    // Table header
    doc.setFillColor(...primaryGreen);
    doc.roundedRect(margin, y - 3, contentWidth, 9, 1, 1, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Description", margin + 5, y + 2.5);
    doc.text("Amount", pageWidth - margin - 5, y + 2.5, { align: "right" });
    y += 10;

    // Table row
    doc.setFillColor(...lightBg);
    doc.rect(margin, y - 3, contentWidth, 9, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...darkText);
    doc.text(description, margin + 5, y + 2.5);
    doc.text(`${totalAmount.toFixed(2)}`, pageWidth - margin - 5, y + 2.5, { align: "right" });
    y += 10;

    // Total row - highlighted
    doc.setFillColor(...primaryGreen);
    doc.roundedRect(margin, y - 3, contentWidth, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("Total", margin + 5, y + 3);
    doc.text(`R${totalAmount.toFixed(2)}`, pageWidth - margin - 5, y + 3, { align: "right" });

    y += 16;

    // Terms & Conditions
    if (terms) {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...primaryGreen);
      doc.text("Terms & Conditions", margin, y);
      y += 7;
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkText);
      const tLines = doc.splitTextToSize(terms, contentWidth);
      doc.text(tLines, margin, y);
      y += tLines.length * 5 + 6;
    }

    // Banking Details
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryGreen);
    doc.text("Banking Details", margin, y);
    y += 8;

    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, y - 3, contentWidth, 38, 2, 2, "F");

    const bx = margin + 5;
    const bvx = margin + 50;

    const drawBankRow = (label: string, value: string, yPos: number) => {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...mutedText);
      doc.setFontSize(9);
      doc.text(label, bx, yPos);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...darkText);
      doc.text(value, bvx, yPos);
      return yPos + 7;
    };

    y = drawBankRow("Bank Name", bankName, y + 2);
    y = drawBankRow("Account Holder", accountHolder, y);
    y = drawBankRow("Branch Code", branchCode, y);
    y = drawBankRow("Account Number", accountNumber, y);
    y = drawBankRow("Reference", reference || booking.registration, y);

    y += 8;

    // Highlighted proof of payment notice
    doc.setFillColor(255, 243, 205);
    doc.roundedRect(margin, y - 4, contentWidth, 12, 2, 2, "F");
    doc.setDrawColor(200, 170, 50);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, y - 4, contentWidth, 12, 2, 2, "S");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 80, 0);
    doc.setFontSize(10);
    doc.text(
      "Please forward proof of payment to +27 73 544 0774",
      pageWidth / 2,
      y + 3,
      { align: "center" }
    );

    // Footer
    doc.setFillColor(...primaryGreen);
    doc.rect(0, 280, pageWidth, 17, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("24/7 Customer Support", pageWidth / 2, 289, { align: "center" });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      "+27 73 544 0774  |  info@ortambopremiumparking.co.za",
      pageWidth / 2,
      294,
      { align: "center" }
    );

    return doc;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const doc = generatePdf();
      setGeneratedPdf(doc);
      toast({
        title: "Invoice generated",
        description: "PDF is ready to download or share.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate invoice",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedPdf || !booking) return;
    const filename = `OR_Tambo_Invoice_${booking.fullName.replace(/\s+/g, "_")}.pdf`;
    generatedPdf.save(filename);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Generate Invoice
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {booking.fullName} — {booking.registration}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Read-only: car + flight */}
          <div className="rounded-lg bg-muted/50 p-3 space-y-2.5 text-sm">
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>
                {booking.vehicleMake} {booking.vehicleModel} ({booking.vehicleColor}) —{" "}
                {booking.registration}
              </span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="totalAmount">Total Amount (R)</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  min={0}
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. 5 Days Parking from 12/02/26 to 16/02/26"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="terms">Terms & Conditions</Label>
              <Textarea
                id="terms"
                placeholder="Optional terms..."
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={2}
              />
            </div>

            {/* Banking Details */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-primary">Banking Details</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bankName" className="text-xs">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountHolder" className="text-xs">Account Holder</Label>
                  <Input
                    id="accountHolder"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="branchCode" className="text-xs">Branch Code</Label>
                  <Input
                    id="branchCode"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="accountNumber" className="text-xs">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reference" className="text-xs">Reference</Label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Vehicle number plate"
                />
              </div>
            </div>

            {/* Highlighted notice */}
            <div className="rounded-lg border-2 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-600 p-3 text-center">
              <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300">
                Please forward proof of payment to +27 73 544 0774
              </p>
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
                <Receipt className="h-4 w-4" />
              )}
              Generate Invoice
            </Button>
          ) : (
            <div className="flex flex-col gap-2 w-full">
              <div className="text-sm text-center text-muted-foreground">
                ✓ Invoice generated successfully
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
