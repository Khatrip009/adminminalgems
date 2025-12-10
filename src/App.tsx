// src/App.tsx
import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";

/* ------------------------------
   PUBLIC (Customer Return Flow)
-------------------------------- */
import LoginPage from "./pages/LoginPage";
import ReturnRequestPage from "./pages/ReturnRequestPage";
import ReturnConfirmationPage from "./pages/ReturnConfirmationPage";
import AccountReturnsPage from "./pages/AccountReturnsPage";

/* ------------------------------
   ADMIN DASHBOARD
-------------------------------- */
import DashboardHome from "./pages/DashboardHome";

/* CRM */
import LeadsPage from "./pages/LeadsPage";
import NotificationsAdminPage from "./pages/NotificationsAdminPage";
import AdminCustomersPage from "./pages/AdminCustomersPage";
import AdminUsersPage from "./pages/AdminUsersPage";

/* Catalog */
import CategoriesPage from "./pages/CategoriesPage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";

/* Orders */
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/AdminOrderDetailPage";

/* Payments */
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AdminPaymentDetailPage from "./pages/AdminPaymentDetailPage";

/* Invoices */
import AdminInvoicesPage from "./pages/AdminInvoicesPage";
import AdminInvoiceDetailPage from "./pages/AdminInvoiceDetailPage";

/* Returns */
import AdminReturnsPage from "./pages/AdminReturnsPage";
import AdminReturnDetailPage from "./pages/AdminReturnDetailPage";

/* Settlements */
import AdminSettlementPage from "./pages/AdminSettlementPage";

/* Marketing */
import AdminPromoCodesPage from "./pages/AdminPromoCodesPage";

/* Settings */
import AdminTaxRulesPage from "./pages/AdminTaxRulesPage";
import AdminShippingMethodsPage from "./pages/AdminShippingMethodsPage";
import AdminShippingRulesPage from "./pages/AdminShippingRulesPage";

/* Analytics */
import AdminAnalyticsOverviewPage from "./pages/AdminAnalyticsOverviewPage";

/* Export handling */
import ExportsPage from "./pages/ExportsPage";
import ExportHistoryPage from "./pages/ExportHistoryPage";

/* Account management */
import AdminProfilePage from "./pages/AdminProfilePage";
import AdminChangePasswordPage from "./pages/AdminChangePasswordPage";
import AdminSecurityLogsPage from "./pages/AdminSecurityLogsPage";
import AdminSecurityAlertsPage from "./pages/AdminSecurityAlertsPage";

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>

        {/* ---------------------------
              PUBLIC ROUTES
        ---------------------------- */}
        <Route path="/login" element={<LoginPage />} />

        <Route path="/return/request" element={<ReturnRequestPage />} />
        <Route path="/return/confirmation" element={<ReturnConfirmationPage />} />
        <Route path="/account/returns" element={<AccountReturnsPage />} />

        {/* ---------------------------
              ADMIN ROUTES
        ---------------------------- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >

          <Route index element={<DashboardHome />} />

          {/* CRM */}
          <Route path="leads" element={<LeadsPage />} />
          <Route path="notifications" element={<NotificationsAdminPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="users" element={<AdminUsersPage />} />

          {/* Profile */}
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="security/change-password" element={<AdminChangePasswordPage />} />
          <Route path="security/logins" element={<AdminSecurityLogsPage />} />
          <Route path="security/alerts" element={<AdminSecurityAlertsPage />} />

          {/* Catalog */}
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />

          {/* Orders */}
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />

          {/* Payments */}
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="payments/:id" element={<AdminPaymentDetailPage />} />

          {/* Invoices */}
          <Route path="invoices" element={<AdminInvoicesPage />} />
          <Route path="invoices/:id" element={<AdminInvoiceDetailPage />} />

          {/* Returns */}
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="returns/:id" element={<AdminReturnDetailPage />} />

          {/* Settlements */}
          <Route path="settlements" element={<AdminSettlementPage />} />

          {/* Marketing */}
          <Route path="marketing/promos" element={<AdminPromoCodesPage />} />

          {/* Settings */}
          <Route path="settings/tax-rules" element={<AdminTaxRulesPage />} />
          <Route path="settings/shipping-methods" element={<AdminShippingMethodsPage />} />
          <Route path="settings/shipping-rules" element={<AdminShippingRulesPage />} />

          {/* Analytics */}
          <Route path="analytics" element={<AdminAnalyticsOverviewPage />} />

          {/* Exports */}
          <Route path="exports" element={<ExportsPage />} />
          <Route path="history" element={<ExportHistoryPage />} />

        </Route>

        {/* Fallback */}
        <Route path="*" element={<LoginPage />} />

      </Routes>
    </HashRouter>
  );
};

export default App;
