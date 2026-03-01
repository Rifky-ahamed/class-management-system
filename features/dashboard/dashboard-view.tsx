import { getDashboardStats } from "./dashboard.service";
import type { Order, Product } from "./dashboard.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  TrendingUp,
  Clock,
} from "lucide-react";

const AdminDashboardView = async () => {
  const stats = await getDashboardStats();

  return (
    // ✅ No h-[calc(...)], no overflow-hidden — layout.tsx owns the scroll
    <div className="flex flex-col gap-6 p-6">

      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden rounded-xl bg-linear-to-br from-edu-900 via-edu-800 to-edu-900 p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16" />
        <div className="relative">
          <p className="text-edu-300 text-xs font-semibold tracking-widest uppercase mb-2">
            Class Management System
          </p>
          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-edu-300 text-sm">
            Overview of your institute — students, teachers & classes
          </p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      {/* ✅ No flex-shrink-0 needed — not inside a fixed height flex container */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Students */}
        <Card className="relative border border-edu-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-edu-50 to-white dark:from-edu-100/10 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-edu-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Students
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-edu-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="h-4 w-4 text-edu-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalOrders}
            </div>
            <div className="flex items-center mt-1 text-xs text-success-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Active students</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Teachers */}
        <Card className="relative border border-edu-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-edu-50 to-white dark:from-edu-100/10 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-edu-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Teachers
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-edu-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-4 w-4 text-edu-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalProducts}
            </div>
            <div className="flex items-center mt-1 text-xs text-success-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Teaching staff</span>
            </div>
          </CardContent>
        </Card>

        {/* Total Classes */}
        <Card className="relative border border-success-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-success-100/50 to-white dark:from-success-100/10 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-success-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Total Classes
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-success-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <BookOpen className="h-4 w-4 text-success-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalUsers}
            </div>
            <div className="flex items-center mt-1 text-xs text-success-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Active classes</span>
            </div>
          </CardContent>
        </Card>

        {/* Service Requests */}
        <Card className="relative border border-warning-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-linear-to-br from-warning-100/50 to-white dark:from-warning-100/10 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-linear-to-br from-warning-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Service Requests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-warning-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ClipboardList className="h-4 w-4 text-warning-600" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">
              {stats.totalRequests}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total service requests
            </p>
          </CardContent>
        </Card>

      </div>

      {/* ── Bottom Two Cards ── */}
      {/* ✅ No flex-1 min-h-0 — cards are natural height */}
      {/* ✅ Internal lists get max-h + overflow-y-auto — only the list scrolls */}
      <div className="grid lg:grid-cols-2 gap-4 pb-6">

        {/* Recent Activities */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <CardHeader className="border-b border-border bg-linear-to-r from-edu-50 to-transparent py-3 shrink-0">
            <CardTitle className="flex items-center text-sm font-semibold text-foreground">
              <Clock className="h-4 w-4 mr-2 text-edu-500" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          {/* ✅ max-h-72 = list capped at ~5 items, then scrolls internally */}
          <CardContent className="pt-4 overflow-y-auto max-h-72">
            <div className="space-y-2">
              {stats.recentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-muted/40 to-transparent hover:from-edu-50 transition-all duration-200 group"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground group-hover:text-edu-600 transition-colors">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm text-foreground">
                      LKR {order.total.toLocaleString()}
                    </p>
                    <Badge
                      className="text-xs"
                      variant={
                        order.status === "paid"
                          ? "default"
                          : order.status === "pending"
                            ? "secondary"
                            : order.status === "shipped"
                              ? "outline"
                              : "destructive"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
              {stats.recentOrders.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No recent activities yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border border-border shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col">
          <CardHeader className="border-b border-border bg-linear-to-r from-danger-100/40 to-transparent py-3 shrink-0">
            <CardTitle className="flex items-center text-sm font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 mr-2 text-danger-500" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          {/* ✅ max-h-72 = list capped at ~5 items, then scrolls internally */}
          <CardContent className="pt-4 overflow-y-auto max-h-72">
            <div className="space-y-2">
              {stats.lowStockProducts.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-linear-to-r from-danger-100/30 to-transparent hover:from-danger-100/60 transition-all duration-200 group"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-sm text-foreground group-hover:text-danger-600 transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                    </p>
                  </div>
                  <Badge variant="destructive" className="text-xs px-2 py-0.5">
                    {product.stock} left
                  </Badge>
                </div>
              ))}

              {stats.lowStockProducts.length === 0 && (
                <div className="text-center py-10">
                  <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6 text-success-500" />
                  </div>
                  <p className="text-foreground font-semibold text-sm">
                    All payments done!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Great job keeping up with payments
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default AdminDashboardView;
