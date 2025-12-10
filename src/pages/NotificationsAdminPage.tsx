import React, { useEffect, useState } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import AdminCard from "../components/ui/AdminCard";
import StatusPill from "../components/ui/StatusPill";
import {
  listNotifications,
  createNotification,
  type NotificationItem,
} from "../api/notifications.api";

type SentFilter = "all" | "sent" | "pending";

interface NotificationFormState {
  title: string;
  body: string;
  audience: "all" | "user";
  userIdOrEmail: string;
  sendMode: "now" | "schedule";
  scheduledAt: string; // datetime-local string
}

const defaultForm: NotificationFormState = {
  title: "",
  body: "",
  audience: "all",
  userIdOrEmail: "",
  sendMode: "now",
  scheduledAt: "",
};

const NotificationsAdminPage: React.FC = () => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [sentFilter, setSentFilter] = useState<SentFilter>("all");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<NotificationFormState>(defaultForm);

  const pages = Math.max(1, Math.ceil(total / limit));

  // Load list
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await listNotifications({
          page,
          limit,
          q: appliedQ || undefined,
          sent:
            sentFilter === "sent"
              ? "true"
              : sentFilter === "pending"
              ? "false"
              : undefined,
        });
        if (!mounted) return;
        setItems(res.items || []);
        setTotal(res.pagination.total || 0);
      } catch (e: any) {
        if (!mounted) return;
        toast.error(e?.message || "Failed to load notifications");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page, limit, appliedQ, sentFilter]);

  const applySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setAppliedQ(q.trim());
  };

  const resetFilters = () => {
    setQ("");
    setAppliedQ("");
    setSentFilter("all");
    setPage(1);
  };

  const openCreate = () => {
    setForm(defaultForm);
    setIsCreateOpen(true);
  };

  const handleCreateChange = <K extends keyof NotificationFormState>(
    key: K,
    value: NotificationFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (form.audience === "user" && !form.userIdOrEmail.trim()) {
      toast.error("Please enter user ID or email for targeted notification");
      return;
    }

    try {
      setCreating(true);

      const payload: any = {
        title: form.title.trim(),
        body: form.body.trim() || null,
      };

      // audience
      if (form.audience === "all") {
        payload.target_query = { type: "all" };
      } else {
        payload.target_query = {
          type: "user",
          user_id: form.userIdOrEmail.trim(),
        };
      }

      // schedule
      if (form.sendMode === "now") {
        payload.scheduled_at = null;
      } else {
        payload.scheduled_at = form.scheduledAt
          ? new Date(form.scheduledAt).toISOString()
          : null;
      }

      await createNotification(payload);
      toast.success("Notification created");

      setIsCreateOpen(false);
      setForm(defaultForm);
      // Reload list
      setPage(1);
      setAppliedQ("");
    } catch (e: any) {
      toast.error(e?.message || "Failed to create notification");
    } finally {
      setCreating(false);
    }
  };

  const start = (page - 1) * limit + 1;
  const end = Math.min(start + items.length - 1, total);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Notifications
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 md:text-sm">
            Send announcements and updates to your customers. Manage scheduled
            and sent notifications in one place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-rose-300/50 transition hover:brightness-110 dark:shadow-rose-900/50"
          >
            <Plus className="h-4 w-4" />
            New Notification
          </button>
        </div>
      </div>

      {/* Filters & list */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,3fr)_minmax(0,5fr)]">
        {/* Filters Card */}
        <AdminCard className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Filters
          </h2>

          <form onSubmit={applySearch} className="space-y-3 text-xs md:text-sm">
            {/* Search */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Title or body text..."
                  className="w-full rounded-full border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-800/40"
                />
              </div>
            </div>

            {/* Sent filter */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Status
              </label>
              <div className="flex gap-1.5">
                {[
                  { key: "all", label: "All" },
                  { key: "sent", label: "Sent" },
                  { key: "pending", label: "Pending" },
                ].map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => {
                      setSentFilter(f.key as SentFilter);
                      setPage(1);
                    }}
                    className={`flex-1 rounded-full px-3 py-1.5 text-[11px] font-medium transition ${
                      sentFilter === f.key
                        ? "bg-slate-900 text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] font-medium text-slate-500 underline-offset-2 hover:underline dark:text-slate-400"
              >
                Reset
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-50 shadow-sm hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Apply
              </button>
            </div>
          </form>
        </AdminCard>

        {/* List Card */}
        <AdminCard className="flex flex-col">
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>
              Showing{" "}
              {total === 0 ? "0" : `${start.toLocaleString()}–${end.toLocaleString()}`}{" "}
              of {total.toLocaleString()}
            </span>
            <span>Page {page} / {pages}</span>
          </div>

          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/70">
            <table className="min-w-full text-left text-[11px] md:text-xs">
              <thead className="bg-slate-100/80 text-slate-500 dark:bg-slate-900/80 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 font-semibold">Title</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Scheduled</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center">
                      <div className="inline-flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading notifications...
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No notifications found with current filters.
                    </td>
                  </tr>
                )}

                {!loading &&
                  items.map((n) => (
                    <tr
                      key={n.id}
                      className="border-t border-slate-100/80 hover:bg-white/70 dark:border-slate-800 dark:hover:bg-slate-900/80"
                    >
                      <td className="px-3 py-2 align-top">
                        <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                          {n.title || "(no title)"}
                        </div>
                        {n.body && (
                          <div className="mt-0.5 line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
                            {n.body}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <StatusPill notification={n} />
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600 dark:text-slate-300">
                        {n.scheduled_at
                          ? new Date(n.scheduled_at).toLocaleString()
                          : "Immediate"}
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] text-slate-600 dark:text-slate-300">
                        {new Date(n.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= pages}
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </AdminCard>
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-end bg-black/30 backdrop-blur-sm">
          <div className="h-full w-full max-w-md bg-white shadow-xl dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  New notification
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Create a broadcast or targeted notification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
              >
                Close
              </button>
            </div>

            <form
              onSubmit={handleCreateSubmit}
              className="h-[calc(100%-57px)] overflow-y-auto px-4 py-4 space-y-4 text-xs md:text-sm"
            >
              {/* Title */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleCreateChange("title", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-800/40"
                  placeholder="E.g. Diwali offer – flat 10% off"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Message
                </label>
                <textarea
                  value={form.body}
                  onChange={(e) => handleCreateChange("body", e.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-800/40"
                  placeholder="This will be visible in your web push / in-app messages…"
                />
              </div>

              {/* Audience */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Audience
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateChange("audience", "all")}
                    className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium ${
                      form.audience === "all"
                        ? "bg-slate-900 text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    All customers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreateChange("audience", "user")}
                    className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium ${
                      form.audience === "user"
                        ? "bg-slate-900 text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    Specific user
                  </button>
                </div>

                {form.audience === "user" && (
                  <input
                    type="text"
                    value={form.userIdOrEmail}
                    onChange={(e) =>
                      handleCreateChange("userIdOrEmail", e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-800/40"
                    placeholder="User ID or email (backend expects user_id)"
                  />
                )}
              </div>

              {/* Schedule */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  Delivery
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCreateChange("sendMode", "now")}
                    className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium ${
                      form.sendMode === "now"
                        ? "bg-slate-900 text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    Send now
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCreateChange("sendMode", "schedule")
                    }
                    className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-medium ${
                      form.sendMode === "schedule"
                        ? "bg-slate-900 text-slate-50 shadow-sm dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    Schedule
                  </button>
                </div>

                {form.sendMode === "schedule" && (
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) =>
                      handleCreateChange("scheduledAt", e.target.value)
                    }
                    className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-sm outline-none ring-0 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:ring-sky-800/40"
                  />
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-300/50 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70 dark:shadow-rose-900/50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create notification"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationsAdminPage;
