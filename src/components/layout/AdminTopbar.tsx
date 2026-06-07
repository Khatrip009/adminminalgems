// src/components/layout/AdminSidebar.tsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { ADMIN_NAV_SECTIONS } from "@/config/adminNav";

interface AdminSidebarProps {
  variant?: "desktop" | "mobile";
  onCloseMobile?: () => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ variant = "desktop", onCloseMobile }) => {
  const location = useLocation();

  const isMobile = variant === "mobile";

  return (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950 ${
      isMobile ? "w-[280px] max-w-[85vw]" : "w-64"
    }`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <Link to="/" className="text-xl font-bold text-slate-800 dark:text-white">
          Minal ERP
        </Link>
        {isMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {ADMIN_NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="mb-2 px-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={isMobile ? onCloseMobile : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  location.pathname === item.path
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;