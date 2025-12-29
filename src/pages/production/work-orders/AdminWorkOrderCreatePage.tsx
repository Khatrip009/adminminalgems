import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { issueWorkOrder } from "@/api/production/workorders.api";
import { apiFetch } from "@/lib/apiClient";
import { searchMaterials } from "@/api/inventory/inventory.materials.api";
import { listWarehouses } from "@/api/masters/warehouses.api";
import { Plus, Trash, Search, Loader2, ArrowLeft } from "lucide-react";

/* =========================================================
   TYPES
========================================================= */
type MaterialRow = {
  material_type: "diamond_packet" | "gold_lot";
  material_id: string | null;
  material_name: string;
  available: number;
  qty: string;
  unit: string;
  error: string | null;
};

type InventoryItem = {
  id: string;
  label: string;
  available_qty: number;
};

const AdminWorkOrderCreatePage: React.FC = () => {
  const navigate = useNavigate();

  /* =========================================================
     HEADER STATE
  ========================================================= */
  const [woNumber, setWoNumber] = useState("");
  const [craftsmen, setCraftsmen] = useState<any[]>([]);
  const [craftsmanId, setCraftsmanId] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [notes, setNotes] = useState("");

  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  /* =========================================================
     MATERIALS
  ========================================================= */
  const [materials, setMaterials] = useState<MaterialRow[]>([]);

  /* =========================================================
     INVENTORY MODAL
  ========================================================= */
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] =
    useState<"diamond_packet" | "gold_lot" | null>(null);
  const [modalIndex, setModalIndex] = useState<number | null>(null);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  /* =========================================================
     INITIAL LOAD
  ========================================================= */
  useEffect(() => {
    setWoNumber(`WO-${Date.now()}`);

    apiFetch("/masters/craftsmen").then((r) => {
      if (r?.ok) setCraftsmen(r.items || r.craftsmen || []);
    });

    listWarehouses().then((r) => {
      if (r?.ok) setWarehouses(r.data || r.results || []);
    });
  }, []);

  /* =========================================================
     MATERIAL ROWS
  ========================================================= */
  const addMaterialRow = () => {
    setMaterials((prev) => [
      ...prev,
      {
        material_type: "diamond_packet",
        material_id: null,
        material_name: "",
        available: 0,
        qty: "",
        unit: "ct",
        error: null,
      },
    ]);
  };

  const removeMaterialRow = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQty = (index: number, value: string) => {
    const updated = [...materials];
    updated[index].qty = value;

    const qty = Number(value);
    const max = Number(updated[index].available);

    if (!qty || qty <= 0) updated[index].error = "Invalid quantity";
    else if (qty > max) updated[index].error = `Only ${max} available`;
    else updated[index].error = null;

    setMaterials(updated);
  };

  /* =========================================================
     INVENTORY MODAL
  ========================================================= */
  const openInventory = async (
    type: "diamond_packet" | "gold_lot",
    index: number
  ) => {
    if (!warehouseId) {
      toast.error("Select warehouse first");
      return;
    }

    setModalType(type);
    setModalIndex(index);
    setModalOpen(true);
    setInventoryLoading(true);

    try {
      const r = await searchMaterials({
        warehouse_id: warehouseId,
        type,
      });

      const rows = r?.materials || [];

      setInventoryItems(
        rows.map((x: any) => ({
          id: x.id,
          label: x.label,
          available_qty: Number(x.available_qty || 0),
        }))
      );
    } catch (e) {
      console.error(e);
      toast.error("Failed to load inventory");
      setInventoryItems([]);
    } finally {
      setInventoryLoading(false);
    }
  };

  const selectInventoryItem = (item: InventoryItem) => {
    if (modalIndex == null) return;

    const updated = [...materials];
    updated[modalIndex] = {
      ...updated[modalIndex],
      material_id: item.id,
      material_name: item.label,
      available: item.available_qty,
      error: null,
    };

    setMaterials(updated);
    setModalOpen(false);
  };

  /* =========================================================
     VALIDATION
  ========================================================= */
  const validate = () => {
    if (!warehouseId) return "Select warehouse";
    if (!craftsmanId) return "Select craftsman";
    if (!expectedReturn) return "Select expected return date";
    if (!materials.length) return "Add at least one material";

    for (const m of materials) {
      if (!m.material_id) return "Select all materials";
      if (!m.qty) return "Enter quantity";
      if (m.error) return m.error;
    }

    return null;
  };

  /* =========================================================
     SUBMIT
  ========================================================= */
  const handleCreate = async () => {
    const err = validate();
    if (err) return toast.error(err);

    const payload = {
      wo_number: woNumber,
      warehouse_id: warehouseId,
      craftsman_id: craftsmanId,
      expected_return: expectedReturn,
      notes,
      materials: materials.map((m) => ({
        material_type: m.material_type,
        material_id: m.material_id,
        qty: Number(m.qty),
        unit: m.unit,
      })),
    };

    const r = await issueWorkOrder(payload);

    if (r?.ok) {
      toast.success("Work Order Created");
      navigate("/admin/work-orders");
    } else {
      toast.error(r?.error || "Failed to create work order");
    }
  };

  /* =========================================================
     RENDER
  ========================================================= */
  return (
    <div className="p-6 space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm">
        <ArrowLeft size={14} className="mr-1" /> Back
      </button>

      <h1 className="text-xl font-semibold">Create Work Order</h1>

      {/* HEADER FORM */}
      <div className="grid grid-cols-2 gap-6">
        <input className="border p-2 rounded" value={woNumber} disabled />

        <select
          className="border p-2 rounded"
          value={warehouseId ?? ""}
          onChange={(e) => setWarehouseId(Number(e.target.value) || null)}
        >
          <option value="">Select Warehouse</option>
          {warehouses.map((w) => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={craftsmanId}
          onChange={(e) => setCraftsmanId(e.target.value)}
        >
          <option value="">Select Craftsman</option>
          {craftsmen.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="date"
          className="border p-2 rounded"
          value={expectedReturn}
          onChange={(e) => setExpectedReturn(e.target.value)}
        />
      </div>

      {/* MATERIALS */}
      <button onClick={addMaterialRow} className="px-3 py-1 bg-blue-600 text-white rounded">
        <Plus size={14} className="mr-1 inline" /> Add Material
      </button>

      <table className="w-full border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th>Material</th>
            <th>Available</th>
            <th>Qty</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {materials.map((row, i) => (
            <tr key={i} className="border-t">
              <td className="p-2">
                <button
                  className="border px-2 py-1 rounded"
                  onClick={() => openInventory(row.material_type, i)}
                >
                  <Search size={14} className="inline mr-1" />
                  {row.material_name || "Select"}
                </button>
              </td>
              <td className="p-2">{row.available}</td>
              <td className="p-2">
                <input
                  className="border px-2 py-1 w-24"
                  value={row.qty}
                  onChange={(e) => updateQty(i, e.target.value)}
                />
                {row.error && <div className="text-xs text-red-600">{row.error}</div>}
              </td>
              <td className="p-2">
                <button onClick={() => removeMaterialRow(i)}>
                  <Trash size={14} className="text-red-500" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleCreate} className="px-6 py-2 bg-green-600 text-white rounded">
        Create Work Order
      </button>

      {/* INVENTORY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-[600px]">
            <h2 className="font-semibold mb-3">Select Material</h2>

            {inventoryLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div
                className="max-h-[380px] overflow-y-auto border rounded"
              >
                {inventoryItems.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-6">
                    No materials found
                  </div>
                ) : (
                  inventoryItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center border-b px-3 py-2 hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium text-sm">{item.label}</div>
                        <div className="text-xs text-gray-500">
                          Available: {item.available_qty}
                        </div>
                      </div>

                      <button
                        onClick={() => selectInventoryItem(item)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Select
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}


            <div className="text-right mt-4">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkOrderCreatePage;
