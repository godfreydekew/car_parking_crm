import { useState, useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookingDetailDrawer } from "@/components/bookings/BookingDetailDrawer";
import { Booking, BookingStatus, PaymentMethod, FlightType } from "@/types/crm";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Search, Filter, Download, MoreHorizontal, Eye, LogIn, CheckCircle2, FileText } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Bookings = () => {
  const { bookings, checkInBooking, collectBooking, isLoading, error } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [flightFilter, setFlightFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter bookings client-side (can be moved to server-side later)
  const filteredBookings = useMemo(() => {
    return bookings.filter(booking => {
      const matchesSearch = searchQuery === "" || 
        booking.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.registration.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.whatsapp.includes(searchQuery) ||
        booking.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesPayment = paymentFilter === "all" || booking.paymentMethod === paymentFilter;
      const matchesFlight = flightFilter === "all" || booking.flightType === flightFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesFlight;
    });
  }, [bookings, searchQuery, statusFilter, paymentFilter, flightFilter]);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleCheckIn = async (booking: Booking) => {
    try {
      await checkInBooking(booking.id);
      toast({
        title: "Check-in successful",
        description: `${booking.fullName}'s vehicle has been checked in.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to check in booking",
        variant: "destructive",
      });
    }
  };

  const handleCollect = async (booking: Booking) => {
    try {
      await collectBooking(booking.id);
      toast({
        title: "Collection recorded",
        description: `${booking.fullName} has collected their vehicle.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to collect booking",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your CSV export is being prepared...",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
          <p className="text-muted-foreground">Manage all parking reservations</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, registration, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="BOOKED">Booked</SelectItem>
            <SelectItem value="ON_SITE">On Site</SelectItem>
            <SelectItem value="COLLECTED">Collected</SelectItem>
            <SelectItem value="OVERSTAY">Overstay</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="NO_SHOW">No Show</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Payment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="CASH">Cash</SelectItem>
            <SelectItem value="EFT">EFT</SelectItem>
            <SelectItem value="CARD">Card</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Select value={flightFilter} onValueChange={setFlightFilter}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Flight Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Flights</SelectItem>
            <SelectItem value="DOMESTIC">Domestic</SelectItem>
            <SelectItem value="INTERNATIONAL">International</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span>{filteredBookings.length} bookings found</span>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredBookings.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No bookings found matching your criteria
          </p>
        ) : (
          filteredBookings.map((booking) => (
            <div key={booking.id} className="border rounded-lg p-4 bg-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{booking.fullName}</p>
                  <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                </div>
                <StatusBadge status={booking.status} />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium">{booking.registration}</p>
                <span className="text-xs px-2 py-0.5 bg-muted rounded">{booking.flightType}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Departure</p>
                  <p>{format(booking.departureDate, 'dd MMM')} {booking.departureTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Arrival</p>
                  <p>{format(booking.arrivalDate, 'dd MMM')} {booking.arrivalTime}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{booking.paymentMethod}</span>
                  <span className="font-semibold">R{booking.cost}</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {booking.status === 'BOOKED' && (
                      <DropdownMenuItem onClick={() => handleCheckIn(booking)}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Mark Check-in
                      </DropdownMenuItem>
                    )}
                    {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                      <DropdownMenuItem onClick={() => handleCollect(booking)}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark Collected
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <FileText className="h-4 w-4 mr-2" />
                      Add Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))
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
                <TableHead>Departure</TableHead>
                <TableHead>Arrival</TableHead>
                <TableHead>Flight</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No bookings found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id} className="group">
                    <TableCell>
                      <div>
                        <p className="font-medium">{booking.fullName}</p>
                        <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono text-sm font-medium">{booking.registration}</p>
                        <p className="text-xs text-muted-foreground">
                          {booking.vehicleMake} {booking.vehicleModel}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(booking.departureDate, 'dd MMM')}</p>
                        <p className="text-xs text-muted-foreground">{booking.departureTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{format(booking.arrivalDate, 'dd MMM')}</p>
                        <p className="text-xs text-muted-foreground">{booking.arrivalTime}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs px-2 py-1 bg-muted rounded font-medium">
                        {booking.flightType}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{booking.paymentMethod}</TableCell>
                    <TableCell className="font-medium">R{booking.cost}</TableCell>
                    <TableCell>
                      <StatusBadge status={booking.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {booking.status === 'BOOKED' && (
                            <DropdownMenuItem onClick={() => handleCheckIn(booking)}>
                              <LogIn className="h-4 w-4 mr-2" />
                              Mark Check-in
                            </DropdownMenuItem>
                          )}
                          {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                            <DropdownMenuItem onClick={() => handleCollect(booking)}>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Mark Collected
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <FileText className="h-4 w-4 mr-2" />
                            Add Note
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BookingDetailDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default Bookings;
