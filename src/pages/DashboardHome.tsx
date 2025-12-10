import React, { useEffect, useState } from "react";
import {
  Activity,
  UserPlus,
  Layers,
  Package,
  ShoppingBag,
  Users,
  CreditCard,
  Bell,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Tag,
  Target,
  BarChart3,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { AdminPageHeader } from "../components/admin/AdminPageHeader";

// Visitors / analytics summary
import { getVisitorSummary } from "../api/analytics.api";

// Leads
import {
  fetchLeadStats,
  fetchLeads,
  type Lead,
  type LeadStats,
} from "../api/leads.api";

// Notifications
import {
  fetchLatestNotifications,
  type NotificationItem,
} from "../api/notifications.api";

// Orders
import { listOrders, type OrderOverview } from "../api/orders.api";

// Products
import {
  fetchProductsAdmin,
  type ProductsAdminListResponse,
} from "../api/products.api";

// Customers
import { listCustomers, type Customer } from "../api/customers.api";

// Promo codes
import { listPromoCodes, type PromoCode } from "../api/promo.api";

// Users / Admins
import { listUsers } from "../api/users.api";

interface VisitorMetrics {
  total_visitors: number;
  visitors_today: number;
  page_views_today: number;
  new_visitors_today: number;
}

/* ------------------------------------------------------------------
   Helpers
------------------------------------------------------------------- */

function formatCurrency(value: number | null | undefined): string {
  const n = Number.isFinite(value as number) ? Number(value) : 0;
  return `₹${n.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Very small categorical mini-bar chart (no external lib).
 */
const MiniBarChart: React.FC<{
  data: { label: string; value: number }[];
}> = ({ data }) => {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value || 0)) || 1;

  return (
    <div className="mt-3 flex h-20 items-end gap-2">
      {data.map((d, idx) => {
        const height = (d.value / max) * 100;
        return (
          <div
            key={`${d.label}-${idx}`}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <div
              className="w-full rounded-full bg-gradient-to-t from-sky-500/20 via-sky-400/60 to-sky-500 shadow-sm"
              style={{ height: `${height}%` }}
            />
            <span className="truncate text-[10px] text-slate-500 dark:text-slate-400 text-center">
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/* ------------------------------------------------------------------
   Component
------------------------------------------------------------------- */

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Visitors / traffic
  const [visitorMetrics, setVisitorMetrics] =
    useState<VisitorMetrics | null>(null);

  // Leads
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [latestLeads, setLatestLeads] = useState<Lead[]>([]);

  // Orders
  const [latestOrders, setLatestOrders] = useState<OrderOverview[]>([]);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // Products
  const [productsSummary, setProductsSummary] = useState<{
    total: number;
    published: number;
  }>({ total: 0, published: 0 });

  // Customers
  const [customersTotal, setCustomersTotal] = useState<number>(0);
  const [latestCustomers, setLatestCustomers] = useState<Customer[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Promo codes
  const [promoSummary, setPromoSummary] = useState<{
    total: number;
    active: number;
  }>({ total: 0, active: 0 });

  // Users
  const [usersSummary, setUsersSummary] = useState<{
    total: number;
    active: number;
    admins: number;
  }>({
    total: 0,
    active: 0,
    admins: 0,
  });

  /* ----------------------------------------------------------------
     Load dashboard data
  ----------------------------------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [
          visitorRes,
          leadStatsRes,
          leadsRes,
          ordersRes,
          productsRes,
          publishedProductsRes,
          customersRes,
          notificationsRes,
          promosRes,
          usersAllRes,
          usersActiveRes,
          adminsRes,
        ] = await Promise.all([
          // Visitors
          getVisitorSummary(),

          // Lead stats + list
          fetchLeadStats(),
          fetchLeads({ page: 1, limit: 5 }),

          // Orders (first page)
          listOrders({ page: 1, limit: 5 }),

          // Products: general list
          fetchProductsAdmin({ page: 1, limit: 5 }),

          // Products: count only published
          fetchProductsAdmin({ is_published: true, page: 1, limit: 1 }),

          // Customers: list first page (also gives total)
          listCustomers({ page: 1, limit: 5 }),

          // Notifications: last few
          fetchLatestNotifications(5),

          // Promo codes
          listPromoCodes({ page: 1, limit: 50 }),

          // Users: all (for total)
          listUsers({ page: 1, limit: 1 }),

          // Users: active
          listUsers({ is_active: true, page: 1, limit: 1 }),

          // Users: admins (role_id = 1 assumed)
          listUsers({ role_id: 1, page: 1, limit: 1 }),
        ]);

        if (cancelled) return;

        // Visitors
        if (visitorRes && (visitorRes as any).metrics) {
          const m = (visitorRes as any).metrics as VisitorMetrics;
          setVisitorMetrics(m);
        }

        // Leads
        if (leadStatsRes && (leadStatsRes as any).stats) {
          setLeadStats((leadStatsRes as any).stats as LeadStats);
        }
        if (leadsRes && (leadsRes as any).leads) {
          setLatestLeads((leadsRes as any).leads || []);
        }

        // Orders
        if (ordersRes && (ordersRes as any).orders) {
          const oRes = ordersRes as any;
          setLatestOrders(oRes.orders || []);
          setTotalOrders(oRes.total || 0);
        }

        // Products
        const productsTotal =
          (productsRes as ProductsAdminListResponse)?.total || 0;
        const publishedTotal =
          (publishedProductsRes as ProductsAdminListResponse)?.total || 0;
        setProductsSummary({
          total: productsTotal,
          published: publishedTotal,
        });

        // Customers
        if (customersRes) {
          const cRes = customersRes as any;
          setCustomersTotal(cRes.total || 0);
          setLatestCustomers(cRes.customers || []);
        }

        // Notifications
        setNotifications((notificationsRes as NotificationItem[]) || []);

        // Promo codes
        const promos = ((promosRes as any)?.promos || []) as PromoCode[];
        const activePromos = promos.filter((p) => p.is_active).length;
        setPromoSummary({
          total: (promosRes as any)?.total || promos.length,
          active: activePromos,
        });

        // Users
        const totalUsers = (usersAllRes as any)?.total || 0;
        const activeUsers = (usersActiveRes as any)?.total || 0;
        const adminCount = (adminsRes as any)?.total || 0;

        setUsersSummary({
          total: totalUsers,
          active: activeUsers,
          admins: adminCount,
        });
      } catch (err) {
        console.error("[DashboardHome] load error", err);
        if (!cancelled) setError("Failed to load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ----------------------------------------------------------------
     Derived metrics
  ----------------------------------------------------------------- */

  const leadsTotal = leadStats?.total || 0;
  const leadsThisWeek = leadStats?.this_week || 0;
  const leadsToday = leadStats?.today || 0;
  const leadsDelta = leadStats?.delta || 0;

  const conversionRate =
    leadsTotal > 0 ? Math.round((totalOrders / leadsTotal) * 100) : null;

  const leadBars: { label: string; value: number }[] = [
    { label: "Today", value: leadsToday },
    { label: "24h", value: leadStats?.last_24h || 0 },
    { label: "Week", value: leadsThisWeek },
    { label: "Total/10", value: Math.round(leadsTotal / 10) },
  ];

  const adminName = user?.full_name || user?.email || "Admin";

  /* ----------------------------------------------------------------
     Render
  ----------------------------------------------------------------- */

  return (
    <div className="relative w-full">
      <AdminPageHeader
        title="Dashboard"
        subtitle="High-level overview of visitors, leads, orders, products, customers and notifications."
        breadcrumbs={[{ label: "Dashboard" }]}
      />

      {/* Loading overlay */}
      {loading && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-20 flex justify-center">
          <div className="inline-flex items-center rounded-full bg-slate-900/90 px-4 py-1.5 text-xs font-medium text-slate-50 shadow-lg backdrop-blur">
            <Activity className="mr-2 h-3 w-3 animate-spin text-emerald-400" />
            Loading live metrics…
          </div>
        </div>
      )}

      <div className="space-y-6 px-6 pb-10 pt-4">
        {/* Welcome + summary strip */}
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Welcome back
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-slate-900 dark:text-slate-50">
                {adminName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You are viewing the global store overview. Use the cards below
                to drill into orders, leads, customers, and inventory.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {conversionRate !== null && (
                <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                  <Target className="mr-1.5 h-3 w-3" />
                  Lead–order conversion:&nbsp;
                  <span className="font-semibold">{conversionRate}%</span>
                </div>
              )}
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <BarChart3 className="mr-1.5 h-3 w-3" />
                Total Orders:&nbsp;
                <span className="font-semibold">{totalOrders}</span>
              </div>
            </div>
          </div>
        </section>

        {/* KPI grids */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* Visitors */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Visitors
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {visitorMetrics?.visitors_today ?? "—"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Today • Total:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {visitorMetrics?.total_visitors ?? "—"}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300">
                <Eye className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Page views today</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {visitorMetrics?.page_views_today ?? "—"}
              </span>
            </div>
          </div>

          {/* Leads */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Leads
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {leadsThisWeek || "—"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  This week • Total:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {leadsTotal || 0}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                <UserPlus className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 inline-flex items-center text-[11px] font-medium">
              {leadsDelta >= 0 ? (
                <>
                  <TrendingUp className="mr-1 h-3 w-3 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-300">
                    +{leadsDelta} vs yesterday
                  </span>
                </>
              ) : (
                <>
                  <TrendingDown className="mr-1 h-3 w-3 text-rose-500" />
                  <span className="text-rose-600 dark:text-rose-300">
                    {leadsDelta} vs yesterday
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Orders */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Orders
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {totalOrders}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Latest order:{" "}
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {latestOrders[0]?.order_number || "—"}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                <ShoppingBag className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Sample AOV (top order)</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {latestOrders[0]
                  ? formatCurrency(latestOrders[0].grand_total)
                  : "—"}
              </span>
            </div>
          </div>

          {/* Users / admins */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Users & admins
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {usersSummary.total}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Active:&nbsp;
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {usersSummary.active}
                  </span>{" "}
                  • Admins:&nbsp;
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {usersSummary.admins}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Second row KPIs: products, customers, promos, notifications */}
        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* Products */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Products
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {productsSummary.total}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Published:&nbsp;
                  <span className="font-medium text-emerald-600 dark:text-emerald-300">
                    {productsSummary.published}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Package className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Customers
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {customersTotal}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Latest:&nbsp;
                  <span className="font-medium text-slate-800 dark:text-slate-100">
                    {latestCustomers[0]?.name ||
                      latestCustomers[0]?.email ||
                      "—"}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Promo codes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Promo codes
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {promoSummary.total}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Active:&nbsp;
                  <span className="font-medium text-emerald-600 dark:text-emerald-300">
                    {promoSummary.active}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300">
                <Tag className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Notifications
                </p>
                <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                  {notifications.length > 0 ? notifications.length : "—"}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Showing last {notifications.length || 0} admin campaigns
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                <Bell className="h-5 w-5" />
              </div>
            </div>
          </div>
        </section>

        {/* Main analytics row: Leads mini chart + Latest orders + Latest leads */}
        <section className="grid gap-5 xl:grid-cols-3">
          {/* Leads mini-chart / funnel */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Lead flow snapshot
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Based on today, last 24 hours and this week.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Activity className="h-3 w-3" />
                Live
              </span>
            </div>
            <MiniBarChart data={leadBars} />
          </div>

          {/* Latest orders */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Latest orders
              </h3>
              <a
                href="/orders"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                View all
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2 text-xs">
              {latestOrders.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  No orders found yet.
                </p>
              )}
              {latestOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      #{order.order_number}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {order.customer_name ||
                        order.customer_email ||
                        "Guest"}{" "}
                      · {formatDate(order.placed_at)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-50">
                      {formatCurrency(order.grand_total)}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {order.payment_status} • {order.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Latest leads */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Recent leads
              </h3>
              <a
                href="/leads"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                Manage leads
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2 text-xs">
              {latestLeads.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  No leads captured yet.
                </p>
              )}
              {latestLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {lead.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {lead.email}
                      {lead.phone ? ` • ${lead.phone}` : ""}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {lead.status}
                    </span>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(lead.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Notifications + Health */}
        <section className="grid gap-5 lg:grid-cols-2">
          {/* Latest notifications */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Recent notifications
              </h3>
              <a
                href="/notifications"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400"
              >
                Notification center
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
            <div className="space-y-2 text-xs">
              {notifications.length === 0 && (
                <p className="text-slate-500 dark:text-slate-400">
                  No notifications scheduled or sent yet.
                </p>
              )}
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-900 dark:text-slate-50">
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {n.body}
                      </span>
                    )}
                  </div>
                  <div className="ml-3 text-right">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {n.sent ? "Sent" : "Scheduled"}
                    </span>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* System health */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
              Quick system health
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Categories & products
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {productsSummary.total > 0
                    ? "Catalog configured"
                    : "No products yet"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Orders & checkout
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {totalOrders > 0 ? "Live orders present" : "No orders yet"}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-slate-500 dark:text-slate-300" />
                  <span className="text-slate-700 dark:text-slate-200">
                    Customers & leads
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {customersTotal > 0 || leadsTotal > 0
                    ? "Acquisition running"
                    : "Waiting for first traffic"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Error message */}
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 shadow-sm dark:border-rose-800 dark:bg-rose-900/30 dark:text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardHome;
