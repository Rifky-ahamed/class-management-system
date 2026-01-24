"use server";
import { createClient } from "@/lib/supabase/server";

const getDashboardStats = async () => {
  const supabase = await createClient();

  const [
    { count: totalOrders },
    { count: totalProducts },
    { count: totalUsers },
    { count: totalRequests },
    { data: recentOrders },
    { data: lowStockProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("repair_requests")
      .select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*, order_items(*, product:products(*))")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("products").select("*").lt("stock", 10).order("stock"),
  ]);

  return {
    totalOrders: totalOrders || 0,
    totalProducts: totalProducts || 0,
    totalUsers: totalUsers || 0,
    totalRequests: totalRequests || 0,
    recentOrders: recentOrders || [],
    lowStockProducts: lowStockProducts || [],
  };
};

export { getDashboardStats };
