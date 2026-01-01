import { useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { KPICard } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DollarSign,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { format, isToday, subDays, isAfter } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { bookings, collectBooking } = useCRM();

  const stats = useMemo(() => {
    const carsOnSite = bookings.filter(b => b.status === 'ON_SITE' || b.status === 'OVERSTAY').length;
    const arrivalsToday = bookings.filter(b => 
      b.status === 'BOOKED' && isToday(b.departureDate)
    ).length;
    const pickupsToday = bookings.filter(b => 
      (b.status === 'ON_SITE' || b.status === 'OVERSTAY') && isToday(b.arrivalDate)
    ).length;
    const overstays = bookings.filter(b => b.status === 'OVERSTAY').length;
    
    const sevenDaysAgo = subDays(new Date(), 7);
    const revenue7d = bookings
      .filter(b => isAfter(b.timestamp, sevenDaysAgo) && b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + b.cost, 0);

    return { carsOnSite, arrivalsToday, pickupsToday, overstays, revenue7d };
  }, [bookings]);

  const revenueData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayBookings = bookings.filter(b => 
        format(b.timestamp, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
        b.status !== 'CANCELLED'
      );
      return {
        date: format(date, 'EEE'),
        revenue: dayBookings.reduce((sum, b) => sum + b.cost, 0),
        bookings: dayBookings.length,
      };
    });
    return days;
  }, [bookings]);

  const paymentBreakdown = useMemo(() => {
    const breakdown = bookings.reduce((acc, b) => {
      if (b.status !== 'CANCELLED') {
        acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(breakdown).map(([method, count]) => ({
      name: method,
      value: count,
    }));
  }, [bookings]);

  const overstayBookings = useMemo(() => 
    bookings.filter(b => b.status === 'OVERSTAY').slice(0, 5),
  [bookings]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here's your parking overview.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          title="Cars On Site"
          value={stats.carsOnSite}
          icon={Car}
          trend={{ value: 12, label: "vs yesterday" }}
        />
        <KPICard
          title="Arrivals Today"
          value={stats.arrivalsToday}
          subtitle="Expected drop-offs"
          icon={PlaneTakeoff}
        />
        <KPICard
          title="Pickups Today"
          value={stats.pickupsToday}
          subtitle="Expected collections"
          icon={PlaneLanding}
        />
        <KPICard
          title="Overstays"
          value={stats.overstays}
          icon={Clock}
          iconClassName={stats.overstays > 0 ? "bg-warning/10" : undefined}
        />
        <KPICard
          title="Revenue (7d)"
          value={`R${stats.revenue7d.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: 8, label: "vs last week" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-medium">Revenue Trend (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-1))"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 -mt-4">
                {paymentBreakdown.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-xs text-muted-foreground">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Booking Volume */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Booking Volume (7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs fill-muted-foreground" />
                <YAxis className="text-xs fill-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="bookings" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Overstays - Mobile Cards / Desktop Table */}
      {overstayBookings.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-medium">Overstays Requiring Attention</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/overstays">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {/* Mobile Cards */}
            <div className="space-y-3 md:hidden">
              {overstayBookings.map((booking) => (
                <div key={booking.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{booking.fullName}</p>
                      <p className="font-mono text-sm text-muted-foreground">{booking.registration}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Expected: {format(booking.arrivalDate, 'dd MMM, HH:mm')}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => collectBooking(booking.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
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
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Expected Pickup</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overstayBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.fullName}</TableCell>
                      <TableCell className="font-mono text-sm">{booking.registration}</TableCell>
                      <TableCell>{format(booking.arrivalDate, 'dd MMM, HH:mm')}</TableCell>
                      <TableCell><StatusBadge status={booking.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => collectBooking(booking.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Collected
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
