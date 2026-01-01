import { useState, useMemo, useCallback } from "react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingDetailDrawer } from "@/components/bookings/BookingDetailDrawer";
import { Booking } from "@/types/crm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { format, isToday } from "date-fns";
import {
  Search,
  LogIn,
  LogOut,
  CheckCircle2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const CheckInOut = () => {
  const { bookings, searchBookings, checkInBooking, collectBooking } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [scanDialogOpen, setScanDialogOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"checkin" | "checkout">("checkin");
  const [scanInput, setScanInput] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Daily stats
  const todayStats = useMemo(() => {
    const checkIns = bookings.filter(
      (b) => b.checkInTime && isToday(b.checkInTime)
    ).length;

    const checkOuts = bookings.filter(
      (b) => b.collectedTime && isToday(b.collectedTime)
    ).length;

    return { checkIns, checkOuts };
  }, [bookings]);

  // Search results
  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchBookings(searchQuery).slice(0, 8);
  }, [searchQuery, searchBookings]);

  // Currently on site (for checkout)
  const onSiteBookings = useMemo(
    () =>
      bookings.filter((b) => b.status === "ON_SITE" || b.status === "OVERSTAY"),
    [bookings]
  );

  const handleScan = useCallback(() => {
    if (!scanInput.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a booking ID or vehicle registration.",
        variant: "destructive",
      });
      return;
    }

    const found = bookings.find(
      (b) =>
        b.id.toString().toLowerCase() === scanInput.toLowerCase() ||
        b.registration.toLowerCase().replace(/\s/g, "") ===
          scanInput.toLowerCase().replace(/\s/g, "")
    );

    if (found) {
      if (scanMode === "checkin" && found.status === "BOOKED") {
        checkInBooking(found.id);
        toast({
          title: "Check-in successful",
          description: `${found.fullName}'s vehicle (${found.registration}) is now ON SITE.`,
        });
        setScanDialogOpen(false);
        setScanInput("");
      } else if (
        scanMode === "checkout" &&
        (found.status === "ON_SITE" || found.status === "OVERSTAY")
      ) {
        collectBooking(found.id);
        toast({
          title: "Check-out successful",
          description: `${found.fullName}'s vehicle (${found.registration}) has been collected.`,
        });
        setScanDialogOpen(false);
        setScanInput("");
      } else {
        toast({
          title: "Invalid action",
          description: `This booking cannot be ${
            scanMode === "checkin" ? "checked in" : "checked out"
          }. Current status: ${found.status}`,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Not found",
        description: "No booking found with that ID or registration.",
        variant: "destructive",
      });
    }
  }, [scanInput, scanMode, bookings, checkInBooking, collectBooking]);

  const handleCheckIn = (booking: Booking) => {
    checkInBooking(booking.id);
    toast({
      title: "Check-in successful",
      description: `${booking.fullName}'s vehicle is now ON SITE.`,
    });
  };

  const handleCollect = (booking: Booking) => {
    collectBooking(booking.id);
    toast({
      title: "Check-out successful",
      description: `${booking.fullName} has collected their vehicle.`,
    });
  };

  const openScanDialog = (mode: "checkin" | "checkout") => {
    setScanMode(mode);
    setScanInput("");
    setScanDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Check-in / Check-out
        </h1>
        <p className="text-muted-foreground">
          Vehicle drop-off and pick-up management
        </p>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/20">
                <ArrowDownToLine className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-ins Today</p>
                <p className="text-3xl font-bold text-foreground">
                  {todayStats.checkIns}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-info/20">
                <ArrowUpFromLine className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Check-outs Today
                </p>
                <p className="text-3xl font-bold text-foreground">
                  {todayStats.checkOuts}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:border-success/50 transition-all hover:shadow-lg group"
          onClick={() => openScanDialog("checkin")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-6 rounded-2xl bg-success/10 group-hover:bg-success/20 transition-colors">
              <LogIn className="h-12 w-12 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-1">
                Drop-off (Check-in)
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter booking ID or registration
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-info/50 transition-all hover:shadow-lg group"
          onClick={() => openScanDialog("checkout")}
        >
          <CardContent className="p-8 flex flex-col items-center text-center gap-4">
            <div className="p-6 rounded-2xl bg-info/10 group-hover:bg-info/20 transition-colors">
              <LogOut className="h-12 w-12 text-info" />
            </div>
            <div>
              <h3 className="font-semibold text-xl mb-1">
                Pick-up (Check-out)
              </h3>
              <p className="text-sm text-muted-foreground">
                Enter booking ID or registration
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Quick Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, registration, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg h-12"
          />

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y max-h-80 overflow-auto">
              {searchResults.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-start justify-between cursor-pointer"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setDrawerOpen(true);
                    }}
                  >
                    <div>
                      <p className="font-medium">{booking.fullName}</p>
                      <p className="text-sm text-muted-foreground font-mono">
                        {booking.registration}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {booking.status === "BOOKED" && (
                      <Button
                        size="sm"
                        onClick={() => handleCheckIn(booking)}
                        className="gap-1 bg-success hover:bg-success/90 flex-1 sm:flex-none"
                      >
                        <LogIn className="h-4 w-4" />
                        Check-in
                      </Button>
                    )}
                    {(booking.status === "ON_SITE" ||
                      booking.status === "OVERSTAY") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCollect(booking)}
                        className="gap-1 border-info text-info hover:bg-info/10 flex-1 sm:flex-none"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Check-out
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No bookings found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Access: On-Site Vehicles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>Vehicles On Site ({onSiteBookings.length})</span>
            <span className="text-xs font-normal text-muted-foreground">
              Ready for check-out
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onSiteBookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No vehicles currently on site
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {onSiteBookings.slice(0, 6).map((booking) => (
                <div
                  key={booking.id}
                  className="p-3 border rounded-lg hover:border-info/50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono font-semibold text-sm">
                      {booking.registration}
                    </p>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm font-medium truncate">
                    {booking.fullName}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">
                    {booking.checkInTime &&
                      `Checked in: ${format(
                        booking.checkInTime,
                        "dd MMM, HH:mm"
                      )}`}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCollect(booking)}
                    className="w-full gap-1 border-info text-info hover:bg-info/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Check-out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in/Check-out Dialog */}
      <Dialog
        open={scanDialogOpen}
        onOpenChange={setScanDialogOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {scanMode === "checkin" ? (
                <LogIn className="h-5 w-5 text-success" />
              ) : (
                <LogOut className="h-5 w-5 text-info" />
              )}
              {scanMode === "checkin"
                ? "Drop-off (Check-in)"
                : "Pick-up (Check-out)"}
            </DialogTitle>
            <DialogDescription>
              Enter the booking ID or vehicle registration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Input
              placeholder="Booking ID or Registration (e.g., CA 123-456)"
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="text-center text-lg h-12"
              autoFocus
            />

            <div className="flex gap-3">
              <Button
                onClick={handleScan}
                disabled={!scanInput.trim()}
                className={`flex-1 h-11 ${
                  scanMode === "checkin"
                    ? "bg-success hover:bg-success/90"
                    : "bg-info hover:bg-info/90"
                }`}
              >
                {scanMode === "checkin"
                  ? "Confirm Check-in"
                  : "Confirm Check-out"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setScanDialogOpen(false);
                  setScanInput("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BookingDetailDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default CheckInOut;
