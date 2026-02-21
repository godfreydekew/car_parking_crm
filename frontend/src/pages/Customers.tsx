import { useState, useMemo } from "react";
import { useCRM } from "@/context/useCRM";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Customer, Booking } from "@/types/crm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import {
  Search,
  Users,
  Star,
  Eye,
  Mail,
  Phone,
  Calendar,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type CustomerFilter = 'all' | 'repeat' | 'cancelled';

const ITEMS_PER_PAGE = 10;

const Customers = () => {
  const { customers, bookings, getBookingsByCustomer } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<CustomerFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Filter by active filter
    if (activeFilter === 'repeat') {
      filtered = filtered.filter((c) => c.isRepeat);
    } else if (activeFilter === 'cancelled') {
      filtered = filtered.filter((c) => {
        const customerBookings = getBookingsByCustomer(c.id);
        return customerBookings.some(
          (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
        );
      });
    }
    // 'all' shows all customers, no filter needed

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.fullName.toLowerCase().includes(query) ||
          c.email.toLowerCase().includes(query) ||
          c.whatsapp.includes(searchQuery)
      );
    }

    return filtered;
  }, [customers, searchQuery, activeFilter, getBookingsByCustomer]);

  // Reset to page 1 when filters change
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCustomers, currentPage]);

  // Reset page when filters/search change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  const repeatCustomers = useMemo(
    () => customers.filter((c) => c.isRepeat).length,
    [customers]
  );

  const cancelledNoShowCount = useMemo(() => {
    return customers.filter((c) => {
      const customerBookings = getBookingsByCustomer(c.id);
      return customerBookings.some(
        (b) => b.status === "CANCELLED" || b.status === "NO_SHOW"
      );
    }).length;
  }, [customers, getBookingsByCustomer]);

  const customerBookings = useMemo(() => {
    if (!selectedCustomer) return [];
    return getBookingsByCustomer(selectedCustomer.id);
  }, [selectedCustomer, getBookingsByCustomer]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-foreground">Customers</h1>
        <p className="text-[13px] text-muted-foreground">Manage your customer database</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card
          className={
            activeFilter === 'all'
              ? "ring-2 ring-primary cursor-pointer"
              : "cursor-pointer hover:bg-muted/50 transition-colors"
          }
          onClick={() => setActiveFilter('all')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{customers.length}</p>
              <p className="text-sm text-muted-foreground">
                All Customers
                {activeFilter === 'all' && (
                  <span className="ml-1 text-primary">(filtered)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            activeFilter === 'repeat'
              ? "ring-2 ring-primary cursor-pointer"
              : "cursor-pointer hover:bg-muted/50 transition-colors"
          }
          onClick={() => setActiveFilter('repeat')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Star className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{repeatCustomers}</p>
              <p className="text-sm text-muted-foreground">
                Repeat Customers
                {activeFilter === 'repeat' && (
                  <span className="ml-1 text-primary">(filtered)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            activeFilter === 'cancelled'
              ? "ring-2 ring-primary cursor-pointer"
              : "cursor-pointer hover:bg-muted/50 transition-colors"
          }
          onClick={() => setActiveFilter('cancelled')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-destructive/10">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-semibold">{cancelledNoShowCount}</p>
              <p className="text-sm text-muted-foreground">
                Cancelled / No Show
                {activeFilter === 'cancelled' && (
                  <span className="ml-1 text-primary">(filtered)</span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {activeFilter !== 'all' && (
          <Button
            variant="outline"
            onClick={() => setActiveFilter('all')}
            className="gap-2"
          >
            {activeFilter === 'repeat' && <Star className="h-4 w-4" />}
            {activeFilter === 'cancelled' && <XCircle className="h-4 w-4" />}
            Clear Filter
          </Button>
        )}
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {filteredCustomers.length === 0 ? (
          <p className="text-center py-12 text-muted-foreground">
            No customers found
          </p>
        ) : (
          paginatedCustomers.map((customer) => (
            <div
              key={customer.id}
              className="border border-border/60 rounded-[var(--radius)] p-4 bg-card card-surface space-y-3"
              onClick={() => {
                setSelectedCustomer(customer);
                setDrawerOpen(true);
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {customer.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="font-medium">{customer.fullName}</p>
                    {customer.isRepeat && (
                      <Badge variant="secondary" className="text-xs mt-0.5">
                        <Star className="h-3 w-3 mr-1" />
                        Repeat
                      </Badge>
                    )}
                  </div>
                </div>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-sm space-y-1">
                {customer.email && (
                  <p className="text-muted-foreground">{customer.email}</p>
                )}
                <p className="text-muted-foreground">{customer.whatsapp}</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm pt-2 border-t">
                <div>
                  <p className="text-muted-foreground text-xs">Bookings</p>
                  <p className="font-medium">{customer.bookingCount}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Spend</p>
                  <p className="font-medium">
                    R{customer.totalSpend.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Last Visit</p>
                  <p className="font-medium">
                    {customer.lastVisit
                      ? format(customer.lastVisit, "dd MMM")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="border border-border/60 rounded-[var(--radius)] overflow-hidden bg-card card-surface hidden md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Total Spend</TableHead>
                <TableHead>Last Visit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No customers found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                          {customer.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium">{customer.fullName}</p>
                          {customer.isRepeat && (
                            <Badge
                              variant="secondary"
                              className="text-xs mt-0.5"
                            >
                              <Star className="h-3 w-3 mr-1" />
                              Repeat
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {customer.email ? (
                          <p className="text-sm">{customer.email}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            No email
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {customer.whatsapp}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer.bookingCount}
                    </TableCell>
                    <TableCell className="font-medium">
                      R{customer.totalSpend.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {customer.lastVisit ? (
                        format(customer.lastVisit, "dd MMM yyyy")
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setDrawerOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedCustomer && (
            <>
              <SheetHeader className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-medium text-primary">
                    {selectedCustomer.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <SheetTitle className="text-xl">
                      {selectedCustomer.fullName}
                    </SheetTitle>
                    {selectedCustomer.isRepeat && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        <Star className="h-3 w-3 mr-1" />
                        Repeat Customer
                      </Badge>
                    )}
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Contact Info */}
                <div className="space-y-3">
                  <h3 className="section-label">
                    Contact Information
                  </h3>
                  <div className="space-y-2">
                    {selectedCustomer.email ? (
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedCustomer.email}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="italic">No email on file</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedCustomer.whatsapp}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold">
                      {selectedCustomer.bookingCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total Bookings
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-semibold">
                      R{selectedCustomer.totalSpend.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Spend</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Customer since{" "}
                    {format(selectedCustomer.createdAt, "MMMM yyyy")}
                  </span>
                </div>

                <Separator />

                {/* Booking History */}
                <div className="space-y-3">
                  <h3 className="section-label">
                    Booking History
                  </h3>
                  {customerBookings.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No bookings found
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {customerBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="p-3 border border-border/60 rounded-[var(--radius)] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-mono text-sm font-medium">
                              {booking.registration}
                            </p>
                            <StatusBadge status={booking.status} />
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>
                              {format(booking.departureDate, "dd MMM")} -{" "}
                              {format(booking.arrivalDate, "dd MMM yyyy")}
                            </span>
                            <span className="font-medium text-foreground">
                              R{booking.cost}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default Customers;
