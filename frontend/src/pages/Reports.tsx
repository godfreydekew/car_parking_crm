import { useMemo } from "react";
import { useCRM } from "@/context/CRMContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { format, subDays, isAfter, differenceInDays } from "date-fns";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, TrendingUp, Clock, Users, CreditCard } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Reports = () => {
  const { bookings, customers } = useCRM();

  const revenueByPeriod = useMemo(() => {
    const periods = [7, 30, 90];
    return periods.map(days => {
      const since = subDays(new Date(), days);
      const periodBookings = bookings.filter(b => 
        isAfter(b.timestamp, since) && b.status !== 'CANCELLED'
      );
      return {
        period: `${days}d`,
        revenue: periodBookings.reduce((sum, b) => sum + b.cost, 0),
        bookings: periodBookings.length,
      };
    });
  }, [bookings]);

  const dailyRevenue = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayBookings = bookings.filter(b => 
        format(b.timestamp, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') &&
        b.status !== 'CANCELLED'
      );
      return {
        date: format(date, 'dd MMM'),
        revenue: dayBookings.reduce((sum, b) => sum + b.cost, 0),
      };
    });
  }, [bookings]);

  const avgStayDuration = useMemo(() => {
    const completedBookings = bookings.filter(b => b.status === 'COLLECTED');
    if (completedBookings.length === 0) return 0;
    
    const totalDays = completedBookings.reduce((sum, b) => 
      sum + differenceInDays(b.arrivalDate, b.departureDate), 0
    );
    return Math.round(totalDays / completedBookings.length * 10) / 10;
  }, [bookings]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }, [customers]);

  const paymentBreakdown = useMemo(() => {
    const breakdown = bookings
      .filter(b => b.status !== 'CANCELLED')
      .reduce((acc, b) => {
        acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + b.cost;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(breakdown).map(([method, amount]) => ({
      name: method,
      value: amount,
    }));
  }, [bookings]);

  const flightTypeBreakdown = useMemo(() => {
    const breakdown = bookings
      .filter(b => b.status !== 'CANCELLED')
      .reduce((acc, b) => {
        acc[b.flightType] = (acc[b.flightType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    return Object.entries(breakdown).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [bookings]);

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

  const handleExport = (reportType: string) => {
    toast({
      title: "Export started",
      description: `Your ${reportType} report is being prepared...`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground">Analytics and business insights</p>
        </div>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {revenueByPeriod.map((period) => (
              <Card key={period.period}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R{period.revenue.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      Last {period.period} ({period.bookings} bookings)
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Daily Revenue (30 Days)</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('revenue')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue2" x1="0" y1="0" x2="0" y2="1">
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
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-1))"
                      fillOpacity={1}
                      fill="url(#colorRevenue2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Split */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Revenue by Payment Method</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('payments')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, value }) => `${name}: R${value.toLocaleString()}`}
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
                      formatter={(value: number) => `R${value.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          {/* Operations Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgStayDuration} days</p>
                  <p className="text-sm text-muted-foreground">Average Stay Duration</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-info/10">
                  <CreditCard className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    R{Math.round(bookings.filter(b => b.status !== 'CANCELLED').reduce((sum, b) => sum + b.cost, 0) / bookings.filter(b => b.status !== 'CANCELLED').length)}
                  </p>
                  <p className="text-sm text-muted-foreground">Average Booking Value</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flight Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">Bookings by Flight Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flightTypeBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs fill-muted-foreground" />
                    <YAxis type="category" dataKey="name" className="text-xs fill-muted-foreground" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="value" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{customers.length}</p>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {Math.round(customers.filter(c => c.isRepeat).length / customers.length * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Repeat Customer Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base font-medium">Top Customers by Spend</CardTitle>
              <Button variant="outline" size="sm" onClick={() => handleExport('customers')}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>#</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead className="text-right">Total Spend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer, index) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{customer.fullName}</p>
                          <p className="text-xs text-muted-foreground">{customer.email || customer.whatsapp}</p>
                        </div>
                      </TableCell>
                      <TableCell>{customer.bookingCount}</TableCell>
                      <TableCell className="text-right font-medium">
                        R{customer.totalSpend.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
