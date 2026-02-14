import { useMemo, useState } from "react";
import { useCRM } from "@/context/useCRM";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "recharts";
import { TrendingUp, Clock, Users, CreditCard } from "lucide-react";

type RevenuePeriod = "allTime" | "7d" | "30d" | "90d";

const Reports = () => {
  const { bookings, customers } = useCRM();
  const [selectedPeriod, setSelectedPeriod] = useState<RevenuePeriod>("30d");

  const revenueByPeriod = useMemo(() => {
    const periods = [7, 30, 90];
    return periods.map((days) => {
      const since = subDays(new Date(), days);
      const periodBookings = bookings.filter(
        (b) =>
          isAfter(b.timestamp, since) &&
          b.status !== "CANCELLED" &&
          b.status !== "NO_SHOW",
      );
      return {
        period: `${days}d`,
        revenue: periodBookings.reduce((sum, b) => sum + b.cost, 0),
        bookings: periodBookings.length,
      };
    });
  }, [bookings]);

  const allTimeRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW")
      .reduce((sum, b) => sum + b.cost, 0);
  }, [bookings]);

  const chartData = useMemo(() => {
    if (selectedPeriod === "allTime") {
      // For all time, show monthly data
      const allBookings = bookings.filter(
        (b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW",
      );
      if (allBookings.length === 0) return [];

      const oldestBooking = allBookings.reduce(
        (oldest, b) => (b.timestamp < oldest ? b.timestamp : oldest),
        allBookings[0].timestamp,
      );

      const startDate = new Date(oldestBooking);
      startDate.setDate(1); // Start of first month
      const endDate = new Date();
      endDate.setDate(1); // Start of current month

      const months: { date: string; revenue: number }[] = [];
      const currentMonth = new Date(startDate);

      while (currentMonth <= endDate) {
        const monthStart = new Date(currentMonth);
        const monthEnd = new Date(currentMonth);
        monthEnd.setMonth(monthEnd.getMonth() + 1);

        const monthBookings = bookings.filter(
          (b) =>
            b.timestamp >= monthStart &&
            b.timestamp < monthEnd &&
            b.status !== "CANCELLED" &&
            b.status !== "NO_SHOW",
        );

        months.push({
          date: format(monthStart, "MMM yyyy"),
          revenue: monthBookings.reduce((sum, b) => sum + b.cost, 0),
        });

        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }

      return months;
    } else {
      // For specific periods, show daily data
      const periodDays =
        selectedPeriod === "7d" ? 7 : selectedPeriod === "30d" ? 30 : 90;

      return Array.from({ length: periodDays }, (_, i) => {
        const date = subDays(new Date(), periodDays - 1 - i);
        const dayBookings = bookings.filter(
          (b) =>
            format(b.timestamp, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
            b.status !== "CANCELLED" &&
            b.status !== "NO_SHOW"
        );
        return {
          date: format(date, "dd MMM"),
          revenue: dayBookings.reduce((sum, b) => sum + b.cost, 0),
        };
      });
    }
  }, [bookings, selectedPeriod]);

  const chartTitle = useMemo(() => {
    switch (selectedPeriod) {
      case "allTime":
        return "Revenue of All Time (Monthly)";
      case "7d":
        return "Daily Revenue (Last 7 Days)";
      case "30d":
        return "Daily Revenue (Last 30 Days)";
      case "90d":
        return "Daily Revenue (Last 90 Days)";
      default:
        return "Daily Revenue";
    }
  }, [selectedPeriod]);

  const avgStayDuration = useMemo(() => {
    const completedBookings = bookings.filter((b) => b.status === "COLLECTED");
    if (completedBookings.length === 0) return 0;

    const totalDays = completedBookings.reduce(
      (sum, b) => sum + differenceInDays(b.arrivalDate, b.departureDate),
      0,
    );
    return Math.round((totalDays / completedBookings.length) * 10) / 10;
  }, [bookings]);

  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10);
  }, [customers]);

  const flightTypeBreakdown = useMemo(() => {
    const breakdown = bookings
      .filter((b) => b.status !== "CANCELLED" && b.status !== "NO_SHOW")
      .reduce(
        (acc, b) => {
          acc[b.flightType] = (acc[b.flightType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

    return Object.entries(breakdown).map(([type, count]) => ({
      name: type,
      value: count,
    }));
  }, [bookings]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and business insights
          </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card
              className={
                selectedPeriod === "allTime"
                  ? "ring-2 ring-primary cursor-pointer"
                  : "cursor-pointer hover:bg-muted/50 transition-colors"
              }
              onClick={() => setSelectedPeriod("allTime")}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    R{allTimeRevenue.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Revenue of All Time
                  </p>
                </div>
              </CardContent>
            </Card>
            {revenueByPeriod.map((period) => {
              const periodKey =
                period.period === "7d"
                  ? "7d"
                  : period.period === "30d"
                    ? "30d"
                    : "90d";
              return (
                <Card
                  key={period.period}
                  className={
                    selectedPeriod === periodKey
                      ? "ring-2 ring-primary cursor-pointer"
                      : "cursor-pointer hover:bg-muted/50 transition-colors"
                  }
                  onClick={() => setSelectedPeriod(periodKey as RevenuePeriod)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        R{period.revenue.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last {period.period} ({period.bookings} bookings)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {chartTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="colorRevenue2"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      dataKey="date"
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis className="text-xs fill-muted-foreground" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) =>
                        `R${value.toLocaleString()}`
                      }
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
                  <p className="text-sm text-muted-foreground">
                    Average Stay Duration
                  </p>
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
                    R
                    {Math.round(
                      bookings
                        .filter(
                          (b) =>
                            b.status !== "CANCELLED" && b.status !== "NO_SHOW",
                        )
                        .reduce((sum, b) => sum + b.cost, 0) /
                        bookings.filter(
                          (b) =>
                            b.status !== "CANCELLED" && b.status !== "NO_SHOW",
                        ).length,
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Average Booking Value
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flight Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Bookings by Flight Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flightTypeBreakdown} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-border"
                    />
                    <XAxis
                      type="number"
                      className="text-xs fill-muted-foreground"
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      className="text-xs fill-muted-foreground"
                      width={100}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-2))"
                      radius={[0, 4, 4, 0]}
                    />
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
                  <p className="text-sm text-muted-foreground">
                    Total Customers
                  </p>
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
                    {Math.round(
                      (customers.filter((c) => c.isRepeat).length /
                        customers.length) *
                        100,
                    )}
                    %
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Repeat Customer Rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                Top Customers by Spend
              </CardTitle>
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
                          <p className="text-xs text-muted-foreground">
                            {customer.email || customer.whatsapp}
                          </p>
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
