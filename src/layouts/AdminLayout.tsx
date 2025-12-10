import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminTopbar from "../components/layout/AdminTopbar";
import AdminSidebar from "../components/layout/AdminSidebar";

const AdminLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      {/* Desktop sidebar */}
      <AdminSidebar variant="desktop" />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-50 h-full">
            <AdminSidebar
              variant="mobile"
              onCloseMobile={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* TOPBAR — always above page content */}
        <div className="sticky top-0 z-30 w-full bg-slate-100/80 backdrop-blur dark:bg-slate-950/80">
          <AdminTopbar
            onToggleSidebar={() =>
              setMobileSidebarOpen((open) => !open)
            }
          />
        </div>

        {/* PAGE CONTENT */}
        <main className="relative z-0 flex-1 px-4 py-4 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
