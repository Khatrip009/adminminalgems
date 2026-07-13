import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { UserPlus, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";
import { createCustomer } from "@/api/masters/customers.api";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const AdminAddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    notes: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) {
      toast.error("Full name is required.");
      return;
    }

    setSaving(true);
    try {
      const cleanTags = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      });

      // Optionally update company / country / notes / tags using updateCustomer
      // For now we keep it simple; you can extend later.

      const created = res.customer || res;
      toast.success(`Customer "${created.full_name || form.full_name}" created.`);

      // Redirect to the customer detail page (or to the customers list)
      if (created.id) {
        navigate(`/admin/customers/${created.id}`);
      } else {
        navigate("/admin/customers");
      }
    } catch (err: any) {
      console.error("Failed to create customer", err);
      toast.error(err?.message || "Failed to create customer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <AdminPageHeader
        title="New Customer"
        subtitle="Create a walk‑in / offline customer."
        breadcrumbs={[
          { label: "Dashboard", path: "/" },
          { label: "Customers", path: "/admin/customers" },
          { label: "New" },
        ]}
        actions={
          <button
            onClick={() => navigate("/admin/customers")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            <ArrowLeft size={16} />
            Back to list
          </button>
        }
      />

      <div className="max-w-3xl mx-auto px-6 pt-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, full_name: e.target.value }))
                  }
                  required
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, phone: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="+91 9876543210"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Company</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, company: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Country</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, country: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="India"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, tags: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  placeholder="VIP, WhatsApp"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Internal Notes
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                placeholder="Any internal notes…"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-slate-500">
                <span className="text-rose-500">*</span> Required
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/admin/customers")}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-medium hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-110 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {saving ? "Creating..." : "Create Customer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAddCustomerPage;