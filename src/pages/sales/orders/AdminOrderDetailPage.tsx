// src/pages/AdminOrderDetailPage.tsx

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Package,
  CreditCard,
  Truck,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  ExternalLink,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";

import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { OrderShipments } from "@/components/OrderShipments"; // ✅ new

import {
  getOrderById,
  updateOrderStatus,
  type Order,
  type OrderItem,
  ORDER_STATUS_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
} from "@/api/sales/orders.api";

const PUBLIC_PRODUCT_BASE_PATH =
  import.meta.env.VITE_PUBLIC_PRODUCT_BASE_PATH || "/products";

const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [status, setStatus] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<string>("");

  const invalidId = !id || id === "undefined";

  async function loadOrder() {
    if (invalidId) return;

    setLoading(true);
    try {
      const res = await getOrderById(id!);
      setOrder(res.order);
      setItems(res.items || []);
      setStatus(res.order.status);
      setPaymentStatus(res.order.payment_status);
    } catch (err) {
      console.error("Failed to load order", err);
      toast.error("Failed to load order.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrder();
  }, [id]);

  const formatMoney = (amount: number, currency?: string) => {
    const cur = currency || "INR";
    return `${cur} ${Number(amount || 0).toLocaleString()}`;
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  };

  const getStatusBadgeClass = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "paid" || s === "fulfilled") {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200";
    }
    if (s === "cancelled" || s === "failed") {
      return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-200";
    }
    if (s === "processing" || s === "shipped") {
      return "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200";
    }
    return "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200";
  };

  const handleStatusUpdate = async () => {
    if (!order) return;
    if (!status) {
      toast.error("Order status is required.");
      return;
    }

    setSavingStatus(true);
    try {
      const res = await updateOrderStatus(order.id, {
        status,
        payment_status: paymentStatus || undefined,
      });
      setOrder(res.order);
      toast.success("Order status updated.");
    } catch (err) {
      console.error("Failed to update order status", err);
      toast.error("Failed to update order status.");
    } finally {
      setSavingStatus(false);
    }
  };

  const timelineEvents = useMemo(() => {
    if (!order) return [];
    const events: {
      label: string;
      at: string;
      icon: React.ReactNode;
      tone: string;
    }[] = [];

    if (order.placed_at) {
      events.push({
        label: "Order placed",
        at: order.placed_at,
        icon: <Package size={14} />,
        tone: "text-sky-600 dark:text-sky-300",
      });
    }
    if (order.paid_at) {
      events.push({
        label: "Payment completed",
        at: order.paid_at,
        icon: <CreditCard size={14} />,
        tone: "text-emerald-600 dark:text-emerald-300",
      });
    }
    if (order.shipped_at) {
      events.push({
        label: "Order shipped",
        at: order.shipped_at,
        icon: <Truck size={14} />,
        tone: "text-sky-600 dark:text-sky-300",
      });
    }
    if (order.completed_at) {
      events.push({
        label: "Order completed",
        at: order.completed_at,
        icon: <CheckCircle2 size={14} />,
        tone: "text-emerald-600 dark:text-emerald-300",
      });
    }
    if (order.cancelled_at) {
      events.push({
        label: "Order cancelled",
        at: order.cancelled_at,
        icon: <XCircle size={14} />,
        tone: "text-rose-600 dark:text-rose-300",
      });
    }

    return events.sort((a, b) => +new Date(a.at) - +new Date(b.at));
  }, [order]);

  const parseAddress = (addr: any) => {
    if (!addr) return null;
    return {
      full_name: addr.full_name || addr.name || "",
      line1: addr.line1 || "",
      line2: addr.line2 || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: addr.postal_code || addr.zip || "",
      country: addr.country || "",
      phone: addr.phone || "",
      label: addr.label || "",
    };
  };

  const billing = parseAddress(order?.billing_address);
  const shipping = parseAddress(order?.shipping_address);

  const orderTitle = order
    ? `Order #${order.order_number || order.id.slice(0, 8)}`
    : "Order";

  return (
    <div className="relative">
      <AdminPageHeader
        title={orderTitle}
        subtitle="Inspect order details, payments, shipping and timeline."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Orders", path: "/orders" },
          { label: order ? `#${order.order_number}` : "Order" },
        ]}
        actions={
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to orders
          </button>
        }
      />

      <div className="px-6 pt-4 pb-8 space-y-6">
        {invalidId && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-100">
            Invalid order ID in URL.
          </div>
        )}

        {loading && !invalidId && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <Loader2 className="animate-spin" size={16} />
            Loading order details...
          </div>
        )}

        {!loading && !invalidId && !order && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-900/30 dark:text-rose-100">
            Order not found.
          </div>
        )}

        {!invalidId && order && (
          <>
            {/* TOP SUMMARY + STATUS CONTROL */}
            <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
              {/* Summary + totals */}
              <div className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                      <Calendar size={14} />
                      <span>Placed</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {formatDateTime(order.placed_at)}
                      </span>
                    </div>
                    <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-50">
                      {orderTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Currency:{" "}
                      <span className="font-medium">
                        {order.currency || "INR"}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Current Status
                    </div>
                    <div className="flex flex-wrap justify-end gap-1 text-xs">
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                          getStatusBadgeClass(order.status)
                        }
                      >
                        <Package size={12} />
                        {order.status}
                      </span>
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                          getStatusBadgeClass(order.payment_status)
                        }
                      >
                        <CreditCard size={12} />
                        {order.payment_status}
                      </span>
                      <span
                        className={
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium " +
                          getStatusBadgeClass(order.fulfillment_status)
                        }
                      >
                        <Truck size={12} />
                        {order.fulfillment_status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-950/40">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-300">
                          Subtotal
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          {formatMoney(order.subtotal, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-300">
                          Discount
                        </span>
                        <span className="font-medium text-rose-600 dark:text-rose-300">
                          -
                          {formatMoney(order.discount_total, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-300">
                          Tax
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          {formatMoney(order.tax_total, order.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-slate-600 dark:text-slate-300">
                          Shipping
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-50">
                          {formatMoney(order.shipping_total, order.currency)}
                        </span>
                      </div>
                    </div>
                    <div className="h-16 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />
                    <div className="flex flex-col items-end justify-between gap-2">
                      <div className="text-xs uppercase tracking-wide text-slate-500">
                        Grand total
                      </div>
                      <div className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {formatMoney(order.grand_total, order.currency)}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {order.items_count || 0} item
                        {(order.items_count || 0) === 1 ? "" : "s"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status form + timeline */}
              <div className="space-y-4">
                {/* Status form */}
                <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Update order status
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Order status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select status</option>
                        {ORDER_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">
                        Payment status
                      </label>
                      <select
                        value={paymentStatus}
                        onChange={(e) => setPaymentStatus(e.target.value)}
                        className="w-full rounded-full border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">No change</option>
                        {PAYMENT_STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleStatusUpdate}
                      disabled={savingStatus}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                    >
                      {savingStatus ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <CheckCircle2 size={16} />
                      )}
                      {savingStatus ? "Saving..." : "Save status"}
                    </button>
                  </div>
                </div>

                {/* Timeline */}
                <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <Clock size={16} />
                    Order timeline
                  </div>
                  {timelineEvents.length === 0 ? (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      No timeline events available yet.
                    </div>
                  ) : (
                    <ol className="relative border-l border-slate-200 pl-4 text-sm dark:border-slate-700">
                      {timelineEvents.map((ev, idx) => (
                        <li key={idx} className="mb-4 ml-1">
                          <div
                            className={`mb-1 flex items-center gap-2 text-xs font-semibold ${ev.tone}`}
                          >
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-current ring-2 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
                              {ev.icon}
                            </span>
                            <span>{ev.label}</span>
                          </div>
                          <div className="ml-7 text-xs text-slate-500 dark:text-slate-400">
                            {formatDateTime(ev.at)}
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </div>
            </div>

            {/* ADDRESSES + SHIPMENTS + ITEMS */}
            <div className="grid gap-6 lg:grid-cols-[1.2fr,2fr]">
              {/* Addresses + notes */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <User size={16} />
                    Customer & Billing
                  </div>
                  {billing ? (
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      {billing.full_name && (
                        <div className="font-medium">{billing.full_name}</div>
                      )}
                      {billing.line1 && <div>{billing.line1}</div>}
                      {billing.line2 && <div>{billing.line2}</div>}
                      {(billing.city ||
                        billing.state ||
                        billing.postal_code ||
                        billing.country) && (
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {[billing.city, billing.state, billing.postal_code]
                            .filter(Boolean)
                            .join(", ")}
                          {billing.country ? `, ${billing.country}` : ""}
                        </div>
                      )}
                      {billing.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Phone size={12} /> {billing.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Billing address not available.
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    <MapPin size={16} />
                    Shipping address
                  </div>
                  {shipping ? (
                    <div className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                      {shipping.full_name && (
                        <div className="font-medium">
                          {shipping.full_name}
                        </div>
                      )}
                      {shipping.line1 && <div>{shipping.line1}</div>}
                      {shipping.line2 && <div>{shipping.line2}</div>}
                      {(shipping.city ||
                        shipping.state ||
                        shipping.postal_code ||
                        shipping.country) && (
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {[shipping.city, shipping.state, shipping.postal_code]
                            .filter(Boolean)
                            .join(", ")}
                          {shipping.country ? `, ${shipping.country}` : ""}
                        </div>
                      )}
                      {shipping.phone && (
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Phone size={12} /> {shipping.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Shipping address not available.
                    </div>
                  )}
                </div>

                {(order.notes || order.internal_notes) && (
                  <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Mail size={16} />
                      Notes
                    </div>
                    {order.notes && (
                      <div className="mb-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-950/40 dark:text-slate-200">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Customer notes
                        </div>
                        <p className="whitespace-pre-line">{order.notes}</p>
                      </div>
                    )}
                    {order.internal_notes && (
                      <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-100">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                          Internal notes
                        </div>
                        <p className="whitespace-pre-line">
                          {order.internal_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column: Shipments + Items */}
              <div className="space-y-4">
                {/* ✅ Replaced with the reusable OrderShipments component */}
              <OrderShipments
                  orderId={order.id}
                  orderItems={items.map((it) => ({
                    id: it.id,
                    title: it.product_title || it.title || "Unknown product",
                  }))}
                />
                {/* Items card */}
                <div className="rounded-2xl border border-slate-300 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
                      <Package size={16} />
                      Order items
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {items.length} line item
                      {items.length === 1 ? "" : "s"}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-slate-800 dark:text-slate-200">
                      <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Quantity</th>
                          <th className="px-4 py-3">Unit price</th>
                          <th className="px-4 py-3">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-6 text-center text-sm text-slate-500"
                            >
                              No items found for this order.
                            </td>
                          </tr>
                        ) : (
                          items.map((it) => {
                            const title =
                              it.product_title || it.title || "Unknown product";
                            const unit = it.unit_price ?? 0;
                            const total = it.line_total ?? it.subtotal ?? 0;
                            const slug = it.slug;
                            return (
                              <tr
                                key={it.id}
                                className="border-t border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-medium">{title}</span>
                                    {it.sku && (
                                      <span className="text-xs text-slate-500">
                                        SKU: {it.sku}
                                      </span>
                                    )}
                                    {slug && (
                                      <a
                                        href={`${PUBLIC_PRODUCT_BASE_PATH}/${slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:underline dark:text-sky-300"
                                      >
                                        <ExternalLink size={12} />
                                        View product
                                      </a>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-medium">
                                    {it.quantity}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  {formatMoney(
                                    unit,
                                    (order && order.currency) || it.currency
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  {formatMoney(
                                    total,
                                    (order && order.currency) || it.currency
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrderDetailPage;