// src/config/adminNav.ts
import type React from "react";
import {
  LayoutDashboard,
  Contact2,
  Layers,
  Package,
  ShoppingBag,
  CreditCard,
  FileText,
  RotateCcw,
  Receipt,
  Users,
  Tag,
  Globe2,
  Truck,
  Boxes,
  UserSquare2,
  Activity,
  Bell,

  // 🔥 Missing icons added
  User,
  Lock,
  Clock,
  ShieldAlert,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  badge?: string;
}

export interface AdminNavSection {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  /* ---------------------------------------------------------
   * DASHBOARD
   * --------------------------------------------------------- */
  {
    title: "Dashboard",
    items: [
      {
        label: "Overview",
        path: "/",
        icon: LayoutDashboard,
      },
    ],
  },

  /* ---------------------------------------------------------
   * ACCOUNT
   * --------------------------------------------------------- */
  {
    title: "Account",
    items: [
      { label: "My Profile", path: "/profile", icon: User },
      { label: "Change Password", path: "/security/change-password", icon: Lock },
      { label: "Login Activity", path: "/security/logins", icon: Clock },
      { label: "Security Alerts", path: "/security/alerts", icon: ShieldAlert },
    ],
  },

  /* ---------------------------------------------------------
   * CRM
   * --------------------------------------------------------- */
  {
    title: "CRM",
    items: [
      { label: "Analytics", path: "/analytics", icon: Activity },
      { label: "Leads", path: "/leads", icon: Contact2 },
      { label: "Customers", path: "/customers", icon: UserSquare2 },
      { label: "Users", path: "/users", icon: Users },
      { label: "Notifications", path: "/notifications", icon: Bell },
    ],
  },

  /* ---------------------------------------------------------
   * CATALOG
   * --------------------------------------------------------- */
  {
    title: "Catalog",
    items: [
      { label: "Categories", path: "/categories", icon: Layers },
      { label: "Products", path: "/products", icon: Package },
    ],
  },

  /* ---------------------------------------------------------
   * SALES
   * --------------------------------------------------------- */
  {
    title: "Sales",
    items: [
      { label: "Orders", path: "/orders", icon: ShoppingBag },
      { label: "Payments", path: "/payments", icon: CreditCard },
      { label: "Invoices", path: "/invoices", icon: FileText },
      { label: "Returns", path: "/returns", icon: RotateCcw },
      { label: "Settlements", path: "/settlements", icon: Receipt },

      // Exports
      { label: "Exports", path: "/exports", icon: FileText },
      { label: "Export History", path: "/history", icon: FileText },
    ],
  },

  /* ---------------------------------------------------------
   * MARKETING
   * --------------------------------------------------------- */
  {
    title: "Marketing",
    items: [{ label: "Promo Codes", path: "/marketing/promos", icon: Tag }],
  },

  /* ---------------------------------------------------------
   * SETTINGS
   * --------------------------------------------------------- */
  {
    title: "Settings",
    items: [
      { label: "Tax Rules", path: "/settings/tax-rules", icon: Globe2 },
      { label: "Shipping Methods", path: "/settings/shipping-methods", icon: Truck },
      { label: "Shipping Rules", path: "/settings/shipping-rules", icon: Boxes },
    ],
  },
];
