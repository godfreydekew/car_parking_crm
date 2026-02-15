import { useState, useMemo, useEffect } from "react";
import { useCRM } from "@/context/useCRM";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookingDetailDrawer } from "@/components/bookings/BookingDetailDrawer";
import { BookingConfirmationDialog } from "@/components/bookings/BookingConfirmationDialog";
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
import { Search, Filter, MoreHorizontal, Eye, LogIn, CheckCircle2, FileText, FileCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;

const Bookings = () => {
  const { bookings, checkInBooking, collectBooking, isLoading, error } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [flightFilter, setFlightFilter] = useState<string>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmationBooking, setConfirmationBooking] = useState<Booking | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter bookings client-side
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

  // Paginate filtered bookings
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedBookings = filteredBookings.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, paymentFilter, flightFilter]);

  // Update page when total pages changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking);
    setDrawerOpen(true);
  };

  const handleConfirmation = (booking: Booking) => {
    setConfirmationBooking(booking);
    setConfirmationOpen(true);
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
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Bookings</h1>
        <p className="text-muted-foreground">Manage all parking reservations</p>
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
        {paginatedBookings.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No bookings found matching your criteria
          </p>
        ) : (
          paginatedBookings.map((booking) => (
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
                  <p className="text-muted-foreground text-xs">Drop-off</p>
                  <p>{format(booking.departureDate, 'dd MMM')} {booking.departureTime}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Pick-up</p>
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
                    <DropdownMenuItem onClick={() => handleConfirmation(booking)}>
                      <FileCheck className="h-4 w-4 mr-2" />
                      Confirmation
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
                <TableHead>Drop-off</TableHead>
                <TableHead>Pick-up</TableHead>
                <TableHead>Flight</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    No bookings found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBookings.map((booking) => (
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
                          <DropdownMenuItem onClick={() => handleConfirmation(booking)}>
                            <FileCheck className="h-4 w-4 mr-2" />
                            Confirmation
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return (
                  <PaginationItem key={page}>
                    <PaginationEllipsis />
                  </PaginationItem>
                );
              }
              return null;
            })}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                }}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Page info */}
      {filteredBookings.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing {startIndex + 1} to {Math.min(endIndex, filteredBookings.length)} of {filteredBookings.length} bookings
        </div>
      )}

      <BookingDetailDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />

      <BookingConfirmationDialog
        booking={confirmationBooking}
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
      />
    </div>
  );
};

export default Bookings;
