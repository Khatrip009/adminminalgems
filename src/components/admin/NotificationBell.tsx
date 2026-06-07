// src/components/admin/NotificationBell.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, X } from "lucide-react";
import { useNotifications } from "../../context/NotificationsContext";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import type { NotificationListItem } from "../../types/notification";

interface Props {
  muted?: boolean;
  onToggleMute?: () => void;
}

export default function NotificationBell({ muted = false }: Props) {
  const { unreadCount, latest, fetchPage, markRead, markAllRead } = useNotifications();

  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const ref = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const BEEP_BASE64 =
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=";

  const playBeep = () => {
    if (muted) return;
    try {
      const audio = new Audio(BEEP_BASE64);
      audio.play().catch(() => {});
    } catch {}
  };

  // Close on outside click (touch/mouse)
  useEffect(() => {
    const onDoc = (e: MouseEvent | TouchEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, []);

  // Load first page when dropdown opens
  useEffect(() => {
    if (!open) return;

    setLoading(true);
    (async () => {
      try {
        const r = await fetchPage(1, 12);
        setItems(r.items);
        setPages(r.pages || 1);
        setPage(1);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, fetchPage]);

  // Merge real‑time notifications and play sound
  useEffect(() => {
    if (!latest || latest.length === 0) return;
    playBeep();

    setItems((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const merged = [...latest.filter((n) => !ids.has(n.id)), ...prev];
      return merged.slice(0, 20);
    });
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [latest]);

  const handleLoadPage = async (p: number) => {
    setLoading(true);
    try {
      const r = await fetchPage(p, 12);
      setItems(r.items);
      setPage(p);
      setPages(r.pages || 1);
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark read");
    }
  };

  // Dropdown positioning – recalc on open and window resize
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  useEffect(() => {
    if (!open || !ref.current) return;
    const updatePosition = () => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      const top = rect.bottom + 8;
      const right = window.innerWidth - rect.right;
      let left = rect.right - 320;
      if (left < 8) left = 8;
      setDropdownStyle({
        position: "fixed",
        top: top,
        right: right > 0 ? right : "auto",
        left: left > 0 ? left : "auto",
        maxWidth: "calc(100vw - 16px)",
      });
    };
    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [open]);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return "";
    }
  };

  // Dropdown content (portaled to body)
  const dropdownContent = open && (
    <>
      {/* Backdrop for mobile – easier to tap outside */}
      <div
        className="fixed inset-0 z-[999] bg-black/20 md:hidden"
        onClick={() => setOpen(false)}
      />
      <div
        className="fixed z-[1000] w-[calc(100vw-32px)] max-w-md rounded-2xl border border-slate-200 bg-white dark:bg-slate-900/95 shadow-xl backdrop-blur-md p-2 text-sm dark:border-slate-700"
        style={dropdownStyle}
      >
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-3">
            <span className="text-[12px] font-semibold uppercase text-slate-600 dark:text-slate-400">
              Notifications
            </span>
            <button
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              onClick={() =>
                markAllRead()
                  .then(() => toast.success("All marked read"))
                  .catch(() => toast.error("Failed"))
              }
            >
              Mark all read
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-xs text-slate-400 hover:text-slate-600"
              onClick={() => {
                setOpen(false);
                navigate("/admin/notifications");
              }}
            >
              View all
            </button>
            <button
              className="rounded-md p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </div>
        </div>

        <div
          ref={scrollContainerRef}
          className="max-h-[60vh] overflow-y-auto space-y-1 pr-1"
        >
          {loading && (
            <div className="p-3 text-xs text-slate-500 dark:text-slate-400">
              Loading…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="p-3 text-xs text-slate-500 dark:text-slate-400">
              No notifications.
            </div>
          )}
          {!loading &&
            items.map((n) => (
              <div
                key={n.id}
                className="flex items-start gap-3 rounded-xl p-3 hover:bg-sky-50 dark:hover:bg-slate-800 transition"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap justify-between items-start gap-1">
                    <div className="font-semibold text-[13px]">{n.title}</div>
                    <div className="text-[11px] text-slate-400 whitespace-nowrap">
                      {formatDate(n.created_at)}
                    </div>
                  </div>
                  {n.body && (
                    <div className="mt-1 text-[13px] text-slate-600 dark:text-slate-300 line-clamp-2">
                      {n.body}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="shrink-0 text-xs text-sky-600 dark:text-sky-400 hover:underline px-2 py-1 rounded-md touch-manipulation"
                >
                  Mark read
                </button>
              </div>
            ))}
        </div>

        <div className="mt-2 flex items-center justify-between px-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Page {page} / {pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => handleLoadPage(page - 1)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              disabled={page >= pages}
              onClick={() => handleLoadPage(page + 1)}
              className="rounded-md border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {dropdownContent && createPortal(dropdownContent, document.body)}
    </>
  );
}