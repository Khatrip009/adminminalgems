// src/pages/AdminWorkOrderDetailPage.tsx

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {apiFetch} from "@/lib/apiClient";
import { getWorkOrder } from "@/api/production/workorders.api";

import {
  startWorkOrder,
  completeWorkOrder,
  receiveWorkOrder,
  closeWorkOrder,
} from "@/api/production/workorders.api";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  Package,
  Boxes,
  FileCheck2,
  Plus,
  Trash,
} from "lucide-react";

const STATUS_FLOW = [
  "issued",
  "in_progress",
  "completed",
  "received",
  "closed",
];

const STATUS_LABELS: any = {
  issued: "Issued",
  in_progress: "In Progress",
  completed: "Completed",
  received: "Received",
  closed: "Closed",
};

const AdminWorkOrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [wo, setWO] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Receive modal state
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [grnNumber, setGrnNumber] = useState("");
  const [finishedItems, setFinishedItems] = useState<any[]>([]);

const loadWorkOrder = async () => {
  try {
    const r = await getWorkOrder(id!);

    if (r.ok) {
      setWO(r.work_order);
    } else {
      toast.error("Failed to load work order");
    }
  } catch (e) {
    toast.error("Failed to load work order");
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  /* -----------------------------
      TIMELINE COMPONENT
  ----------------------------- */
  const Timeline = () => {
    const currentIndex = STATUS_FLOW.indexOf(wo.status);
    return (
      <div className="flex items-center space-x-4 my-6">
        {STATUS_FLOW.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                i <= currentIndex ? "bg-green-600" : "bg-gray-400"
              }`}
            >
              {i < currentIndex ? "✓" : i === currentIndex ? "•" : ""}
            </div>
            <span className="ml-2 font-medium">{STATUS_LABELS[s]}</span>
            {i < STATUS_FLOW.length - 1 && (
              <div className="w-10 border-t border-gray-400 mx-3" />
            )}
          </div>
        ))}
      </div>
    );
  };

  /* -----------------------------
      TRANSITION ACTIONS
  ----------------------------- */

  const doStart = async () => {
    const r = await startWorkOrder(id!);
    if (r.ok) {
      toast.success("Work order started");
      loadWorkOrder();
    }
  };

  const doComplete = async () => {
    const r = await completeWorkOrder(id!);
    if (r.ok) {
      toast.success("Completed");
      loadWorkOrder();
    }
  };

const doReceive = async () => {
  if (finishedItems.length === 0) {
    return toast.error("Add finished items");
  }

  const r = await receiveWorkOrder(id!, {
    grn_number: null,                 // ALWAYS NULL
    finished_items: finishedItems,
  });

  if (r.ok) {
    toast.success("Received");
    setReceiveOpen(false);
    loadWorkOrder();
  }
};


  const doClose = async () => {
    const r = await closeWorkOrder(id!);
    if (r.ok) {
      toast.success("Closed");
      loadWorkOrder();
    }
  };

  /* -----------------------------
      RENDER ACTION BUTTONS
  ----------------------------- */
  const ActionButtons = () => {
    if (!wo) return null;

    switch (wo.status) {
      case "issued":
        return (
          <button
            onClick={doStart}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Start Work
          </button>
        );

      case "in_progress":
        return (
          <button
            onClick={doComplete}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Mark Completed
          </button>
        );

      case "completed":
        return (
          <button
            onClick={() => setReceiveOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Receive Work
          </button>
        );

      case "received":
        return (
          <button
            onClick={doClose}
            className="px-4 py-2 bg-black text-white rounded"
          >
            Close Work Order
          </button>
        );

      case "closed":
        return <div className="text-green-700 font-medium">Order Closed</div>;

      default:
        return null;
    }
  };

  /* -----------------------------
      RECEIVE MODAL
  ----------------------------- */

  const addFinishedItem = () => {
    setFinishedItems((prev) => [
      ...prev,
      { sku: "", qty: "", unit: "pcs", valuation: "" },
    ]);
  };

  const updateFinished = (index: number, field: string, value: any) => {
    const updated = [...finishedItems];
    updated[index][field] = value;
    setFinishedItems(updated);
  };

  const removeFinishedItem = (index: number) => {
    setFinishedItems((prev) => prev.filter((_, i) => i !== index));
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!wo) return <div className="p-6 text-red-600">Not found</div>;

  return (
    <div className="p-6">
      {/* Back */}
      <button
        className="flex items-center mb-3 text-sm"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold">Work Order #{wo.wo_number}</h1>
      <p className="text-gray-500">Status: {STATUS_LABELS[wo.status]}</p>

      {/* TIMELINE */}
      <Timeline />

      {/* ACTION BUTTONS */}
      <div className="my-4">
        <ActionButtons />
      </div>

      {/* ================================
          MATERIALS USED
      ================================= */}
      <h2 className="text-lg font-medium mt-8 mb-2 flex items-center">
        <Boxes size={18} className="mr-2" /> Materials Allocated
      </h2>

      <table className="w-full border mb-6">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2">Type</th>
            <th className="p-2">ID</th>
            <th className="p-2">Qty</th>
            <th className="p-2">Unit</th>
          </tr>
        </thead>
        <tbody>
          {wo.materials?.map((m: any) => (
            <tr key={m.id} className="border-t">
              <td className="p-2">{m.material_type}</td>
              <td className="p-2">{m.material_id}</td>
              <td className="p-2">{m.allocated_weight}</td>
              <td className="p-2">{m.unit_of_measure}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================================
          EVENT LOG
      ================================= */}
      <h2 className="text-lg font-medium mt-8 mb-2 flex items-center">
        <Clock size={18} className="mr-2" /> Event History
      </h2>

      {wo.events?.length ? (
        <ul className="space-y-2">
          {wo.events.map((ev: any) => (
            <li key={ev.id} className="p-3 border rounded bg-gray-50">
              <div className="font-medium">
                {STATUS_LABELS[ev.from_status]} → {STATUS_LABELS[ev.to_status]}
              </div>
              <div className="text-sm text-gray-600">
                {ev.event} • {ev.created_at}
              </div>
              {ev.note && <div className="text-sm mt-1">Note: {ev.note}</div>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400">No events recorded</p>
      )}

      {/* ================================
          RECEIVE MODAL
      ================================= */}
      {receiveOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-3">
              Receive Finished Goods
            </h2>

            {/* GRN Number */}
            <div className="mb-3">
              <label className="block text-sm font-medium">GRN Number</label>
              <input
  className="w-full border rounded px-3 py-2 bg-gray-100"
  value={grnNumber || "Auto-generated"}
   readOnly
/>

            </div>

            {/* FINISHED ITEMS TABLE */}
            <div className="mb-3">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Finished Items</label>
                <button
                  onClick={addFinishedItem}
                  className="px-2 py-1 bg-blue-600 text-white rounded flex items-center"
                >
                  <Plus size={14} className="mr-1" /> Add
                </button>
              </div>

              <table className="w-full border mt-2">
                <thead className="bg-gray-100 text-left">
                  <tr>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Qty</th>
                    <th className="p-2">Unit</th>
                    <th className="p-2">Valuation (₹)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {finishedItems.map((row, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={row.sku}
                          onChange={(e) =>
                            updateFinished(index, "sku", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-24"
                          value={row.qty}
                          onChange={(e) =>
                            updateFinished(index, "qty", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-20"
                          value={row.unit}
                          onChange={(e) =>
                            updateFinished(index, "unit", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-24"
                          value={row.valuation}
                          onChange={(e) =>
                            updateFinished(index, "valuation", e.target.value)
                          }
                        />
                      </td>
                      <td className="p-2 text-right">
                        <button onClick={() => removeFinishedItem(index)}>
                          <Trash size={16} className="text-red-600" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {finishedItems.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-gray-500">
                        No finished items added
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setReceiveOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={doReceive}
                className="px-4 py-2 bg-green-600 text-white rounded"
              >
                Receive Work
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkOrderDetailPage;
