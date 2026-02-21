import { useMemo, useState } from "react";
import { useCRM } from "@/context/useCRM";  
import { KPICard } from "@/components/ui/kpi-card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
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
import {
  Car,
  PlaneLanding,
  PlaneTakeoff,
  Clock,
  Calendar,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { format, isToday } from "date-fns";

type ActiveView = 'carsOnSite' | 'arrivalsToday' | 'pickupsToday' | 'overstays' | 'bookedToday';

const Dashboard = () => {
  const { bookings, collectBooking, isLoading } = useCRM();
  const [activeView, setActiveView] = useState<ActiveView>('carsOnSite');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const stats = useMemo(() => {
    const carsOnSite = bookings.filter(b => b.status === 'ON_SITE' || b.status === 'OVERSTAY').length;
    // Arrivals Today = Drop-offs Today (check dropoff_at which is departureDate)
    const arrivalsToday = bookings.filter(b => 
      isToday(b.departureDate)
    ).length;
    // Pickups Today = Pick-ups Today (check pickup_at which is arrivalDate)
    const pickupsToday = bookings.filter(b => 
      isToday(b.arrivalDate)
    ).length;
    const overstays = bookings.filter(b => b.status === 'OVERSTAY').length;
    const bookedToday = bookings.filter(b => isToday(b.timestamp)).length;

    return { carsOnSite, arrivalsToday, pickupsToday, overstays, bookedToday };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    switch (activeView) {
      case 'carsOnSite':
        return bookings.filter(b => b.status === 'ON_SITE' || b.status === 'OVERSTAY');
      case 'arrivalsToday':
        // Drop-offs Today (dropoff_at = departureDate)
        return bookings.filter(b => isToday(b.departureDate));
      case 'pickupsToday':
        // Pick-ups Today (pickup_at = arrivalDate)
        return bookings.filter(b => isToday(b.arrivalDate));
      case 'overstays':
        return bookings.filter(b => b.status === 'OVERSTAY');
      case 'bookedToday':
        return bookings.filter(b => isToday(b.timestamp));
      default:
        return [];
    }
  }, [bookings, activeView]);

  if (isLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-foreground">Dashboard</h1>
        <p className="text-[13px] text-muted-foreground">Welcome back. Here's your parking overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div 
          onClick={() => setActiveView('carsOnSite')}
          className="cursor-pointer h-full"
        >
          <KPICard
            title="Cars On Site"
            value={stats.carsOnSite}
            icon={Car}
            className={activeView === 'carsOnSite' ? 'ring-2 ring-primary' : ''}
          />
        </div>
        <div 
          onClick={() => setActiveView('arrivalsToday')}
          className="cursor-pointer h-full"
        >
          <KPICard
            title="Drop-offs Today"
            value={stats.arrivalsToday}
            subtitle="Expected drop-offs"
            icon={PlaneTakeoff}
            className={activeView === 'arrivalsToday' ? 'ring-2 ring-primary' : ''}
          />
        </div>
        <div 
          onClick={() => setActiveView('pickupsToday')}
          className="cursor-pointer h-full"
        >
          <KPICard
            title="Pickups Today"
            value={stats.pickupsToday}
            subtitle="Expected collections"
            icon={PlaneLanding}
            className={activeView === 'pickupsToday' ? 'ring-2 ring-primary' : ''}
          />
        </div>
        <div 
          onClick={() => setActiveView('overstays')}
          className="cursor-pointer h-full"
        >
          <KPICard
            title="Overstays"
            value={stats.overstays}
            icon={Clock}
            iconClassName={stats.overstays > 0 ? "bg-warning/10" : undefined}
            className={activeView === 'overstays' ? 'ring-2 ring-primary' : ''}
          />
        </div>
        <div 
          onClick={() => setActiveView('bookedToday')}
          className="cursor-pointer h-full"
        >
          <KPICard
            title="Booked Today"
            value={stats.bookedToday}
            icon={Calendar}
            className={activeView === 'bookedToday' ? 'ring-2 ring-primary' : ''}
          />
        </div>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {activeView === 'carsOnSite' && 'Cars On Site'}
            {activeView === 'arrivalsToday' && 'Drop-offs Today'}
            {activeView === 'pickupsToday' && 'Pick-ups Today'}
            {activeView === 'overstays' && 'Overstays'}
            {activeView === 'bookedToday' && 'Booked Today'}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({filteredBookings.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No bookings found
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 md:hidden">
                {filteredBookings.map((booking) => (
                  <div key={booking.id} className="p-4 border border-border/60 rounded-[var(--radius)] card-surface space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{booking.fullName}</p>
                        <p className="font-mono text-sm text-muted-foreground">{booking.registration}</p>
                      </div>
                      <StatusBadge status={booking.status} />
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
                      {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => collectBooking(booking.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Collected
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Drop-off</TableHead>
                      <TableHead>Pick-up</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">{booking.fullName}</TableCell>
                        <TableCell className="font-mono text-sm">{booking.registration}</TableCell>
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
                        <TableCell className="text-sm">{booking.paymentMethod}</TableCell>
                        <TableCell className="font-medium">R{booking.cost}</TableCell>
                        <TableCell><StatusBadge status={booking.status} /></TableCell>
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
                            {(booking.status === 'ON_SITE' || booking.status === 'OVERSTAY') && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => collectBooking(booking.id)}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Collected
                              </Button>
                            )}
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

export default Dashboard;
