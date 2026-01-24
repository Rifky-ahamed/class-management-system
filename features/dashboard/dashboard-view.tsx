import { getDashboardStats } from "./dashboard.service";
import type { Order, Product } from "./dashboard.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Users, Wrench, TrendingUp, Clock } from "lucide-react";

const AdminDashboardView = async () => {
  const stats = await getDashboardStats();

  return (
    <div className="h-[calc(100vh-5rem)] overflow-y-auto space-y-6 p-6">
      {/* Header Section with Gradient Background */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-xb-primary via-xb-secondary to-xb-primary p-6 shadow-xl">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl"></div>
        <div className="relative">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-white/80 text-base">
            Overview of your XYZ Institute
          </p>
        </div>
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -ml-16 -mb-16"></div>
      </div>

      {/* Stats Cards with Enhanced Design */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Students</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
            <div className="flex items-center mt-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Active students</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Teachers</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Package className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
            <div className="flex items-center mt-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Teaching staff</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Total Classes</CardTitle>
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <div className="flex items-center mt-1 text-xs text-green-600 dark:text-green-400">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Active classes</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-card overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
            <CardTitle className="text-xs font-semibold text-muted-foreground">
              Service Requests
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Wrench className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-2xl font-bold text-foreground">{stats.totalRequests}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total service requests
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section with Two Cards */}
      <div className="grid lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Recent Activities */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-xb-primary/5 to-transparent py-3">
            <CardTitle className="flex items-center text-base">
              <Clock className="h-4 w-4 mr-2 text-xb-primary" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {stats.recentOrders.map((order: Order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-muted/30 to-transparent hover:from-muted/50 transition-all duration-200 group"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-xb-primary transition-colors">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold text-sm text-foreground">
                      LKR {order.total.toLocaleString()}
                    </p>
                    <Badge
                      className="shadow-sm text-xs"
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
            </div>
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col">
          <CardHeader className="border-b bg-gradient-to-r from-destructive/5 to-transparent py-3">
            <CardTitle className="flex items-center text-base">
              <TrendingUp className="h-4 w-4 mr-2 text-destructive" />
              Pending Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex-1 overflow-y-auto">
            <div className="space-y-3">
              {stats.lowStockProducts.map((product: Product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-destructive/5 to-transparent hover:from-destructive/10 transition-all duration-200 group"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-sm text-foreground group-hover:text-destructive transition-colors">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.brand}
                    </p>
                  </div>
                  <Badge variant="destructive" className="shadow-sm text-xs px-2 py-1">
                    {product.stock} left
                  </Badge>
                </div>
              ))}
              {stats.lowStockProducts.length === 0 && (
                <div className="text-center py-8">
                  <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-muted-foreground font-medium text-sm">
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