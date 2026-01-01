import { useState, useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { format, formatDistanceToNow } from "date-fns";
import { 
  Search, 
  Car, 
  CheckCircle2, 
  LogIn, 
  Eye,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Operations = () => {
  const { bookings, searchBookings, checkInBooking, collectBooking } = useCRM();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const carsOnSite = useMemo(() => 
    bookings
      .filter(b => b.status === 'ON_SITE' || b.status === 'OVERSTAY')
      .sort((a, b) => (a.checkInTime?.getTime() || 0) - (b.checkInTime?.getTime() || 0)),
  [bookings]);

  const searchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    return searchBookings(searchQuery).slice(0, 10);
  }, [searchQuery, searchBookings]);

  const handleCheckIn = (booking: Booking) => {
    checkInBooking(booking.id);
    toast({
      title: "Check-in successful",
      description: `${booking.fullName}'s vehicle has been checked in.`,
    });
  };

  const handleCollect = (booking: Booking) => {
    collectBooking(booking.id);
    toast({
      title: "Collection recorded",
      description: `${booking.fullName} has collected their vehicle.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Cars On Site</h1>
        <p className="text-muted-foreground">Vehicle monitoring and management</p>
      </div>

      {/* Stats Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-success/10">
              <Car className="h-8 w-8 text-success" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Cars On Site</h3>
              <p className="text-2xl font-bold">{carsOnSite.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Quick Search</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, registration, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border rounded-lg divide-y">
              {searchResults.map((booking) => (
                <div 
                  key={booking.id}
                  className="p-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{booking.fullName}</p>
                      <p className="text-sm text-muted-foreground font-mono">{booking.registration}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex items-center gap-2">
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
                    {booking.status === 'BOOKED' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleCheckIn(booking)}
                        className="gap-1"
                      >
                        <LogIn className="h-4 w-4" />
                        Check-in
                      </Button>
                    )}
                    {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleCollect(booking)}
                        className="gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Collected
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cars Currently On Site */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Cars Currently On Site
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carsOnSite.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">
              No vehicles currently on site
            </p>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {carsOnSite.map((booking) => (
                  <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{booking.fullName}</p>
                        <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>
                    <div>
                      <p className="font-mono text-sm font-medium">{booking.registration}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.vehicleColor} {booking.vehicleMake}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground text-xs">Drop-off</p>
                        {booking.checkInTime && (
                          <p>{format(booking.checkInTime, 'dd MMM, HH:mm')}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs">Expected Pickup</p>
                        <p>{format(booking.arrivalDate, 'dd MMM')} {booking.arrivalTime}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2 border-t">
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
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCollect(booking)}
                        className="flex-1 gap-1"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Collected
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Drop-off Time</TableHead>
                      <TableHead>Expected Pickup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {carsOnSite.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <p className="font-medium">{booking.fullName}</p>
                          <p className="text-xs text-muted-foreground">{booking.whatsapp}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-mono text-sm font-medium">{booking.registration}</p>
                          <p className="text-xs text-muted-foreground">
                            {booking.vehicleColor} {booking.vehicleMake}
                          </p>
                        </TableCell>
                        <TableCell>
                          {booking.checkInTime && (
                            <div>
                              <p>{format(booking.checkInTime, 'dd MMM, HH:mm')}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(booking.checkInTime, { addSuffix: true })}
                              </p>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <p>{format(booking.arrivalDate, 'dd MMM')}</p>
                          <p className="text-xs text-muted-foreground">{booking.arrivalTime}</p>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell className="text-right">
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
                              variant="outline" 
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <BookingDetailDrawer
        booking={selectedBooking}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default Operations;
