import { useState, useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { BookingDetailDrawer } from "@/components/bookings/BookingDetailDrawer";
import { Booking } from "@/types/crm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { format, formatDistanceToNow, differenceInHours } from "date-fns";
import { 
  Clock, 
  Phone, 
  MessageCircle, 
  Eye, 
  CheckCircle2,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Overstays = () => {
  const { bookings, collectBooking } = useCRM();
  const [durationFilter, setDurationFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [extendDialogOpen, setExtendDialogOpen] = useState(false);
  const [extendBooking, setExtendBooking] = useState<Booking | null>(null);

  const overstayBookings = useMemo(() => {
    const overstays = bookings.filter(b => b.status === 'OVERSTAY');
    
    if (durationFilter === "all") return overstays;
    
    const now = new Date();
    return overstays.filter(b => {
      const hoursOverdue = differenceInHours(now, b.arrivalDate);
      switch (durationFilter) {
        case "1h": return hoursOverdue >= 1;
        case "3h": return hoursOverdue >= 3;
        case "24h": return hoursOverdue >= 24;
        default: return true;
      }
    });
  }, [bookings, durationFilter]);

  const handleCollect = (booking: Booking) => {
    collectBooking(booking.id);
    toast({
      title: "Collection recorded",
      description: `${booking.fullName} has collected their vehicle.`,
    });
  };

  const handleSendReminder = (booking: Booking) => {
    toast({
      title: "Reminder sent",
      description: `WhatsApp reminder sent to ${booking.fullName}.`,
    });
  };

  const handleExtendPickup = () => {
    if (extendBooking) {
      toast({
        title: "Pickup extended",
        description: `Pickup time for ${extendBooking.fullName} has been extended.`,
      });
      setExtendDialogOpen(false);
      setExtendBooking(null);
    }
  };

  const getOverdueInfo = (booking: Booking) => {
    const now = new Date();
    const hoursOverdue = differenceInHours(now, booking.arrivalDate);
    
    if (hoursOverdue < 3) {
      return { label: `${hoursOverdue}h overdue`, severity: 'low' };
    } else if (hoursOverdue < 24) {
      return { label: `${hoursOverdue}h overdue`, severity: 'medium' };
    } else {
      const days = Math.floor(hoursOverdue / 24);
      return { label: `${days}d ${hoursOverdue % 24}h overdue`, severity: 'high' };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-warning" />
            Overstays
          </h1>
          <p className="text-muted-foreground">Manage overdue vehicle pickups</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{overstayBookings.length}</p>
              <p className="text-sm text-muted-foreground">Total Overstays</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {overstayBookings.filter(b => differenceInHours(new Date(), b.arrivalDate) >= 24).length}
              </p>
              <p className="text-sm text-muted-foreground">Critical (24h+)</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-info/10">
              <Bell className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {overstayBookings.filter(b => differenceInHours(new Date(), b.arrivalDate) < 3).length}
              </p>
              <p className="text-sm text-muted-foreground">Recent (0-3h)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <Select value={durationFilter} onValueChange={setDurationFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by duration" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Overstays</SelectItem>
            <SelectItem value="1h">1+ Hours Overdue</SelectItem>
            <SelectItem value="3h">3+ Hours Overdue</SelectItem>
            <SelectItem value="24h">24+ Hours Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {overstayBookings.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">No overstays found</p>
        ) : (
          overstayBookings.map((booking) => {
            const overdueInfo = getOverdueInfo(booking);
            return (
              <div key={booking.id} className="border rounded-lg p-4 bg-card space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{booking.fullName}</p>
                    <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    overdueInfo.severity === 'high' 
                      ? 'bg-destructive/10 text-destructive'
                      : overdueInfo.severity === 'medium'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-info/10 text-info'
                  }`}>
                    {overdueInfo.label}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-sm font-medium">{booking.registration}</p>
                  <p className="text-xs text-muted-foreground">
                    {booking.vehicleColor} {booking.vehicleMake}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Expected Pickup</p>
                    <p>{format(booking.arrivalDate, 'dd MMM')} {booking.arrivalTime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Payment</p>
                    <p>{booking.paymentMethod}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedBooking(booking);
                      setDrawerOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleSendReminder(booking)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setExtendBooking(booking);
                      setExtendDialogOpen(true);
                    }}
                  >
                    Extend
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleCollect(booking)}
                    className="gap-1 flex-1"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Collected
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <div className="border rounded-lg overflow-hidden bg-card hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Expected Pickup</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overstayBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No overstays found
                  </TableCell>
                </TableRow>
              ) : (
                overstayBookings.map((booking) => {
                  const overdueInfo = getOverdueInfo(booking);
                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{booking.fullName}</p>
                          <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-mono text-sm font-medium">{booking.registration}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.vehicleColor} {booking.vehicleMake}
                        </p>
                      </TableCell>
                      <TableCell>
                        <p>{format(booking.arrivalDate, 'dd MMM yyyy')}</p>
                        <p className="text-xs text-muted-foreground">{booking.arrivalTime}</p>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          overdueInfo.severity === 'high' 
                            ? 'bg-destructive/10 text-destructive'
                            : overdueInfo.severity === 'medium'
                            ? 'bg-warning/10 text-warning'
                            : 'bg-info/10 text-info'
                        }`}>
                          {overdueInfo.label}
                        </span>
                      </TableCell>
                      <TableCell>{booking.paymentMethod}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDrawerOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleSendReminder(booking)}
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setExtendBooking(booking);
                              setExtendDialogOpen(true);
                            }}
                          >
                            Extend
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => handleCollect(booking)}
                            className="gap-1"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Collected
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Extend Dialog */}
      <Dialog open={extendDialogOpen} onOpenChange={setExtendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Extend Pickup Time</DialogTitle>
            <DialogDescription>
              Extend the expected pickup time for {extendBooking?.fullName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Current expected pickup: {extendBooking && format(extendBooking.arrivalDate, 'dd MMM yyyy, HH:mm')}
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExtendPickup} className="flex-1">
                Extend by 24 hours
              </Button>
              <Button variant="outline" onClick={() => setExtendDialogOpen(false)}>
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

export default Overstays;
