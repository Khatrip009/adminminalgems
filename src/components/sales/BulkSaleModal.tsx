// src/components/sales/BulkSaleModal.tsx
import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Save, Plus, Trash2 } from "lucide-react";
import { fetchProductsAdmin, type Product } from "@/api/masters/products.api";
import { createSalesItem } from "@/api/sales/sales.api";

/* =========================================================
   TYPES
========================================================= */

interface DiamondInput {
  pcs: number;
  carat: number;
  rate: number;
  type?: string;
  packet_no?: string | null;
}

interface SaleLineItem {
  product_id?: string | null;
  item: string;
  diamonds: DiamondInput[];
  gold: number;
  gold_carat: number;
  gold_rate: number;
  labour_charge: number;
  profit_percent: number;
  craftsman_name?: string;
  remarks?: string;
  conversion_rate?: number;
}

interface BulkSaleFormValues {
  customer_id: string | null;
  customer_name: string;
  lineItems: SaleLineItem[];
}

interface BulkSaleModalProps {
  onClose: () => void;
  onSuccess: () => void;
  customers: any[];
}

/* =========================================================
   PRODUCT ROW (unchanged)
========================================================= */

interface ProductRowProps {
  index: number;
  register: any;
  setValue: any;
  watch: any;
  control: any;
  products: Product[];
  removeRow: () => void;
}

const ProductRow: React.FC<ProductRowProps> = ({
  index,
  register,
  setValue,
  watch,
  control,
  products,
  removeRow,
}) => {
  const [productSearch, setProductSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const { fields, append, remove } = useFieldArray({
    control,
    name: `lineItems.${index}.diamonds`,
  });

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products.slice(0, 20);
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.title.toLowerCase().includes(q)).slice(0, 20);
  }, [products, productSearch]);

  const handleProductSelect = useCallback(
    (prod: Product) => {
      setProductSearch(prod.title);
      setShowSuggestions(false);
      setValue(`lineItems.${index}.product_id`, prod.id);
      setValue(`lineItems.${index}.item`, prod.title);
      setValue(`lineItems.${index}.gold_carat`, prod.gold_carat || 18);

      const productRate = Number(prod.rate) || 0;
      let diamondData: any[] = [];
      if (Array.isArray(prod.diamonds)) {
        diamondData = prod.diamonds;
      } else if (typeof prod.diamonds === "string") {
        try {
          diamondData = JSON.parse(prod.diamonds);
        } catch {}
      }

      const currentLength = fields.length;
      for (let i = 0; i < currentLength; i++) remove(0);

      if (diamondData.length > 0) {
        diamondData.forEach((d: any) => {
          append({
            pcs: d.pcs || 1,
            carat: d.carat || 0,
            rate: Number(d.rate) || productRate,
            type: d.type || "Diamond",
            packet_no: d.packet_no || "",
          });
        });
      } else {
        append({ pcs: 1, carat: 0, rate: productRate, type: "Diamond", packet_no: "" });
      }
    },
    [index, setValue, fields.length, remove, append]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="border rounded-lg p-4 mb-4 relative">
      <button
        type="button"
        onClick={removeRow}
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
      >
        <Trash2 size={16} />
      </button>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Product Search */}
        <div className="relative" ref={suggestionRef}>
          <label className="block text-xs font-medium mb-1">Product</label>
          <input
            type="text"
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value.trim()) setValue(`lineItems.${index}.product_id`, null);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search product..."
            className="w-full border rounded p-1 text-sm"
          />
          {showSuggestions && filteredProducts.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => handleProductSelect(prod)}
                  className="px-2 py-1 hover:bg-indigo-50 cursor-pointer text-sm"
                >
                  {prod.title}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Item Description</label>
          <input
            {...register(`lineItems.${index}.item`, { required: true })}
            className="w-full border rounded p-1 text-sm"
            placeholder="Product name"
          />
        </div>

        {/* Diamonds */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Diamonds</label>
          {fields.map((df, di) => (
            <div key={df.id} className="grid grid-cols-5 gap-1 mb-1 items-end">
              <input type="number" step="1" {...register(`lineItems.${index}.diamonds.${di}.pcs`, { valueAsNumber: true })} className="border rounded p-1 text-xs" placeholder="Pcs" />
              <input type="number" step="0.01" {...register(`lineItems.${index}.diamonds.${di}.carat`, { valueAsNumber: true })} className="border rounded p-1 text-xs" placeholder="Carat" />
              <input type="number" step="0.01" {...register(`lineItems.${index}.diamonds.${di}.rate`, { valueAsNumber: true })} className="border rounded p-1 text-xs" placeholder="Rate" />
              <input {...register(`lineItems.${index}.diamonds.${di}.type`)} className="border rounded p-1 text-xs" placeholder="Type" />
              <button type="button" onClick={() => remove(di)} className="text-red-500"><Trash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => append({ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" })} className="text-indigo-600 text-xs mt-1">+ Add Diamond</button>
        </div>

        {/* Gold fields */}
        <div>
          <label className="block text-xs font-medium mb-1">Gold Wt (g)</label>
          <input type="number" step="0.01" {...register(`lineItems.${index}.gold`, { valueAsNumber: true })} className="w-full border rounded p-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Gold Carat</label>
          <input type="number" step="0.1" {...register(`lineItems.${index}.gold_carat`, { valueAsNumber: true })} className="w-full border rounded p-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Gold Rate (₹/g)</label>
          <input type="number" step="0.01" {...register(`lineItems.${index}.gold_rate`, { valueAsNumber: true })} className="w-full border rounded p-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Labour (₹)</label>
          <input type="number" step="0.01" {...register(`lineItems.${index}.labour_charge`, { valueAsNumber: true })} className="w-full border rounded p-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Profit %</label>
          <input type="number" step="0.01" {...register(`lineItems.${index}.profit_percent`, { valueAsNumber: true })} className="w-full border rounded p-1 text-sm" />
        </div>

        {/* Craftsman, Remarks, Conversion Rate */}
        <div>
          <label className="block text-xs font-medium mb-1">Craftsman Name</label>
          <input
            {...register(`lineItems.${index}.craftsman_name`)}
            className="w-full border rounded p-1 text-sm"
            placeholder="Optional"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium mb-1">Remarks</label>
          <textarea
            rows={2}
            {...register(`lineItems.${index}.remarks`)}
            className="w-full border rounded p-1 text-sm"
            placeholder="Any notes..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Conv. Rate (₹ → 1 USD)</label>
          <input
            type="number"
            step="0.0001"
            {...register(`lineItems.${index}.conversion_rate`, { valueAsNumber: true })}
            className="w-full border rounded p-1 text-sm"
            placeholder="e.g. 83.50"
          />
        </div>
      </div>
    </div>
  );
};

/* =========================================================
   MAIN BULK SALE MODAL (with invoice prefix)
========================================================= */

const BulkSaleModal: React.FC<BulkSaleModalProps> = ({ onClose, onSuccess, customers }) => {
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerRef = useRef<HTMLDivElement>(null);

  // ---------- MANUAL INVOICE PREFIX ----------
  const [invoicePrefix, setInvoicePrefix] = useState("");
  // ------------------------------------------

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BulkSaleFormValues>({
    defaultValues: {
      customer_id: null,
      customer_name: "",
      lineItems: [{
        product_id: null,
        item: "",
        diamonds: [{ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" }],
        gold: 0,
        gold_carat: 0,
        gold_rate: 0,
        labour_charge: 0,
        profit_percent: 0,
        craftsman_name: "",
        remarks: "",
        conversion_rate: 0,
      }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchProductsAdmin({ limit: 10000 });
        if (res?.ok) setProducts(res.products || []);
      } catch {
        toast.error("Failed to load products");
      }
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 20);
    const q = customerSearch.toLowerCase();
    return customers.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 20);
  }, [customers, customerSearch]);

  const handleCustomerSelect = useCallback(
    (cust: any) => {
      setValue("customer_id", cust.id);
      setValue("customer_name", cust.name);
      setCustomerSearch(cust.name);
      setShowCustomerSuggestions(false);
    },
    [setValue]
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (customerRef.current && !customerRef.current.contains(e.target as Node)) {
        setShowCustomerSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const onSubmit = async (data: BulkSaleFormValues) => {
    setLoading(true);
    try {
      // Use provided prefix or auto‑generate a short unique code
      const prefix = invoicePrefix.trim() || `BLK-${Date.now().toString(36).toUpperCase()}`;

      for (let i = 0; i < data.lineItems.length; i++) {
        const item = data.lineItems[i];
        if (!item.item.trim()) continue;

        const formData = new FormData();
        formData.append("number", `${prefix}-${i + 1}`);
        formData.append("item", item.item);
        formData.append("diamonds", JSON.stringify(item.diamonds));
        formData.append("gold", String(item.gold));
        formData.append("gold_carat", String(item.gold_carat));
        formData.append("gold_rate", String(item.gold_rate));
        formData.append("labour_charge", String(item.labour_charge));
        formData.append("profit_percent", String(item.profit_percent));
        formData.append("customer_id", data.customer_id || "");
        formData.append("customer_name", data.customer_name);
        if (item.product_id) formData.append("product_id", item.product_id);
        if (item.craftsman_name) formData.append("craftsman_name", item.craftsman_name);
        if (item.remarks) formData.append("remarks", item.remarks);
        if (item.conversion_rate) formData.append("conversion_rate", String(item.conversion_rate));

        await createSalesItem(formData);
      }
      toast.success(`Created ${data.lineItems.length} sales items`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to create bulk sales");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-bold">Bulk Sale (Multiple Products)</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-6">
          {/* Invoice Number Prefix */}
          <div>
            <label className="block text-sm font-medium mb-1">Invoice Number Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              placeholder="e.g., INV-2026 (auto if empty)"
              className="w-full border rounded-lg p-2 text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Each item will be numbered as <strong>PREFIX-1</strong>, <strong>PREFIX-2</strong>, …
            </p>
          </div>

          {/* Customer selection */}
          <div className="relative" ref={customerRef}>
            <label className="block text-sm font-medium mb-1">Customer</label>
            <input
              type="text"
              value={customerSearch}
              onChange={(e) => {
                setCustomerSearch(e.target.value);
                setShowCustomerSuggestions(true);
                if (!e.target.value.trim()) {
                  setValue("customer_id", null);
                  setValue("customer_name", "");
                }
              }}
              onFocus={() => setShowCustomerSuggestions(true)}
              placeholder="Search customer..."
              className="w-full border rounded-lg p-2 text-sm"
            />
            {showCustomerSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <div key={c.id} onClick={() => handleCustomerSelect(c)} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer text-sm">
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-2">Products</h3>
            {fields.map((field, index) => (
              <ProductRow
                key={field.id}
                index={index}
                register={register}
                setValue={setValue}
                watch={watch}
                control={control}
                products={products}
                removeRow={() => remove(index)}
              />
            ))}
            <button
              type="button"
              onClick={() => append({
                product_id: null,
                item: "",
                diamonds: [{ pcs: 1, carat: 0, rate: 0, type: "Diamond", packet_no: "" }],
                gold: 0,
                gold_carat: 0,
                gold_rate: 0,
                labour_charge: 0,
                profit_percent: 0,
                craftsman_name: "",
                remarks: "",
                conversion_rate: 0,
              })}
              className="text-indigo-600 flex items-center gap-1 hover:text-indigo-700 mt-2"
            >
              <Plus size={16} /> Add Product
            </button>
          </div>

          {/* Footer */}
          <div className="border-t pt-4 flex justify-end gap-2 sticky bottom-0 bg-white pb-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
              {loading ? "Saving..." : <><Save size={16} /> Create Bulk Sales</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkSaleModal;