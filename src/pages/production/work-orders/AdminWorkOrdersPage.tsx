import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listWorkOrders } from "@/api/production/workorders.api";

const PAGE_SIZE = 20;

const AdminWorkOrdersPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await listWorkOrders(PAGE_SIZE, offset);

        if (r?.ok && Array.isArray(r.results)) {
          setItems(r.results);
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error(e);
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [offset]);

  return (
    <div className="p-6">
      <div className="flex justify-between mb-6">
        <h1 className="text-xl font-semibold">Work Orders</h1>
        <Link
          to="/admin/work-orders/create"
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Create Work Order
        </Link>
      </div>

      <div className="border rounded overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">WO</th>
              <th className="p-3">Craftsman</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Expected</th>
              <th className="p-3 text-center">Materials</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  Loading…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center">
                  No work orders found
                </td>
              </tr>
            ) : (
              items.map((wo) => (
                <tr key={wo.id} className="border-t">
                  <td className="p-3">{wo.wo_number}</td>
                  <td className="p-3">{wo.craftsman_name || "-"}</td>
                  <td className="p-3 capitalize">{wo.status}</td>
                  <td className="p-3">{wo.created_at}</td>
                  <td className="p-3">{wo.expected_return}</td>
                  <td className="p-3 text-center">{wo.materials_count}</td>
                  <td className="p-3">
                    <Link
                      to={`/admin/work-orders/${wo.id}`}
                      className="text-blue-600 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between mt-4">
        <button
          disabled={offset === 0}
          onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          disabled={items.length < PAGE_SIZE}
          onClick={() => setOffset(offset + PAGE_SIZE)}
          className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminWorkOrdersPage;
