// src/components/admin/ProductPreview.tsx
import React, {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { TouchEvent, MouseEvent } from "react";
import {
  X,
  Heart,
  Bell,
  Package,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* -------------------------------------------------
   model-viewer is already declared in src/types/model-viewer.d.ts
   No need to redeclare here.
-------------------------------------------------- */

interface PreviewAsset {
  id: string;
  url: string;
  asset_type: string;
  file_type?: string | null;
  is_primary?: boolean;
  sort_order?: number | null;
}

interface PreviewProduct {
  id: string;
  title: string;
  short_description?: string | null;
  description?: string | null;
  price: number;
  currency: string;
  available_qty?: number | null;
  trade_type?: string | null;
  sku?: string | null;
  assets?: PreviewAsset[];
}

interface ProductPreviewProps {
  product: PreviewProduct | null;
  open: boolean;
  onClose: () => void;
}

function PriceTagMini({ price, currency }: { price: number; currency: string }) {
  return (
    <div className="text-2xl sm:text-3xl font-semibold text-rose-600 mt-2">
      {currency}{" "}
      {Number(price || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })}
    </div>
  );
}

function RatingStarsMini() {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-1 mt-1">
      {stars.map((s) => (
        <span key={s} className="text-yellow-400 text-base sm:text-lg">
          ★
        </span>
      ))}
      <span className="text-xs text-slate-500 ml-1">(4.7)</span>
    </div>
  );
}

const isImage = (a: PreviewAsset) =>
  a.asset_type === "image" || (a.file_type || "").startsWith("image/");

const isVideo = (a: PreviewAsset) =>
  a.asset_type === "video" || (a.file_type || "").startsWith("video/");

const is3D = (a: PreviewAsset) => {
  const ft = (a.file_type || "").toLowerCase();
  const url = (a.url || "").toLowerCase();
  return (
    a.asset_type === "3d" ||
    ft.includes("model") ||
    url.endsWith(".glb") ||
    url.endsWith(".gltf") ||
    url.endsWith(".usdz")
  );
};

// Detect touch device
const isTouchDevice = () => {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
};

const ProductPreview: React.FC<ProductPreviewProps> = ({
  product,
  open,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [deviceMode, setDeviceMode] = useState<"desktop" | "mobile">("desktop");

  // Zoom state (desktop only)
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const assets: PreviewAsset[] = useMemo(
    () => (Array.isArray(product?.assets) ? product!.assets! : []),
    [product]
  );

  const sortedAssets = useMemo(() => {
    if (!assets.length) return [];
    return [...assets].sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [assets]);

  const activeAsset = sortedAssets[activeIndex] || sortedAssets[0] || null;

  useEffect(() => {
    if (!open) return;
    if (!sortedAssets.length) return;
    const primaryIndex = sortedAssets.findIndex((a) => a.is_primary);
    setActiveIndex(primaryIndex >= 0 ? primaryIndex : 0);
    setIsZooming(false);
  }, [open, product, sortedAssets]);

  const goPrev = () => {
    if (!sortedAssets.length) return;
    setActiveIndex((prev) =>
      prev > 0 ? prev - 1 : sortedAssets.length - 1
    );
  };

  const goNext = () => {
    if (!sortedAssets.length) return;
    setActiveIndex((prev) =>
      prev < sortedAssets.length - 1 ? prev + 1 : 0
    );
  };

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    setTouchStartX(touch.clientX);
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX === null) return;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const threshold = 40;
    if (deltaX > threshold) {
      goPrev();
    } else if (deltaX < -threshold) {
      goNext();
    }
    setTouchStartX(null);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!activeAsset || !isImage(activeAsset)) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const handleMouseEnter = () => {
    if (!activeAsset || !isImage(activeAsset)) return;
    if (isTouchDevice()) return;
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const overlayBg = isDark ? "bg-black/70" : "bg-black/50";
  const modalBg = isDark ? "bg-slate-900 text-slate-50" : "bg-white text-slate-900";
  const borderColor = isDark ? "border-slate-700" : "border-slate-200";

  return (
    <AnimatePresence>
      {open && product && (
        <motion.div
          key="preview-overlay"
          className={`fixed inset-0 z-[200] flex items-center justify-center ${overlayBg} backdrop-blur-sm p-2 sm:p-4`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" onClick={onClose} />

          <motion.div
            key="preview-modal"
            className={`relative w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl ${modalBg} border ${borderColor}`}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* TOP BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-5 sm:py-3 border-b border-slate-200/60 dark:border-slate-700/60">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="uppercase tracking-wide text-[10px] sm:text-[11px] text-slate-500">
                  Preview
                </span>

                <div className="flex items-center gap-1 rounded-full bg-slate-100/70 dark:bg-slate-800/70 p-1">
                  <button
                    type="button"
                    onClick={() => setDeviceMode("desktop")}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:text-[11px] ${
                      deviceMode === "desktop"
                        ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                        : "text-slate-500"
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Desktop</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeviceMode("mobile")}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:text-[11px] ${
                      deviceMode === "mobile"
                        ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                        : "text-slate-500"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Mobile</span>
                  </button>
                </div>

                <div className="flex items-center gap-1 rounded-full bg-slate-100/70 dark:bg-slate-800/70 p-1">
                  <button
                    type="button"
                    onClick={() => setIsDark(false)}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:text-[11px] ${
                      !isDark
                        ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                        : "text-slate-500"
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDark(true)}
                    className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] sm:text-[11px] ${
                      isDark
                        ? "bg-white dark:bg-slate-900 shadow text-slate-900 dark:text-slate-50"
                        : "text-slate-500"
                    }`}
                  >
                    <Moon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dark</span>
                  </button>
                </div>
              </div>

              <button
                onClick={onClose}
                className="rounded-full bg-slate-100/90 dark:bg-slate-800/80 p-1.5 sm:p-2 text-slate-700 dark:text-slate-100 shadow hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            <div className="p-3 sm:p-5 overflow-y-auto max-h-[calc(95vh-60px)]">
              <div
                className={`mx-auto ${
                  deviceMode === "mobile"
                    ? "relative rounded-[2rem] sm:rounded-[2.5rem] border border-slate-300/80 bg-slate-900/95 p-3 pb-6 shadow-inner shadow-black/60 max-w-xs sm:max-w-sm"
                    : ""
                }`}
              >
                {deviceMode === "mobile" && (
                  <>
                    <div className="absolute inset-x-16 top-2 h-4 sm:h-5 rounded-full bg-black/80" />
                    <div className="mt-5 sm:mt-7" />
                  </>
                )}

                <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                  {/* LEFT: MEDIA */}
                  <div
                    className="relative"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    <div
                      className={`relative overflow-hidden rounded-xl sm:rounded-2xl border ${borderColor} shadow-sm bg-slate-100 dark:bg-slate-900`}
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    >
                      {activeAsset ? (
                        <>
                          {is3D(activeAsset) && (
                            <model-viewer
                              src={activeAsset.url}
                              ar
                              ar-modes="webxr scene-viewer quick-look"
                              camera-controls
                              auto-rotate
                              shadow-intensity="1"
                              exposure="1"
                              camera-orbit="45deg auto auto"
                              style={{
                                width: "100%",
                                height: deviceMode === "mobile" ? "320px" : "420px",
                                background: isDark ? "#020617" : "#f1f5f9",
                                borderRadius: "16px",
                              }}
                            />
                          )}

                          {!is3D(activeAsset) && isImage(activeAsset) && (
                            <>
                              <img
                                src={activeAsset.url}
                                alt={product.title}
                                className={`w-full ${
                                  deviceMode === "mobile"
                                    ? "aspect-[9/16]"
                                    : "aspect-[4/5]"
                                } object-cover`}
                              />

                              {isZooming && deviceMode === "desktop" && !isTouchDevice() && (
                                <div className="pointer-events-none absolute inset-0 hidden lg:block">
                                  <div
                                    className="absolute right-2 top-2 h-32 w-32 sm:h-40 sm:w-40 overflow-hidden rounded-xl border border-slate-300 bg-slate-100 shadow-lg"
                                    style={{
                                      backgroundImage: `url(${activeAsset.url})`,
                                      backgroundSize: "220%",
                                      backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                                    }}
                                  />
                                </div>
                              )}
                            </>
                          )}

                          {!is3D(activeAsset) && isVideo(activeAsset) && (
                            <video
                              src={activeAsset.url}
                              controls
                              className={`w-full rounded-xl sm:rounded-2xl ${
                                deviceMode === "mobile"
                                  ? "aspect-[9/16]"
                                  : "aspect-[16/9]"
                              } object-cover`}
                            />
                          )}

                          {sortedAssets.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={goPrev}
                                className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 sm:p-2 text-white hover:bg-black"
                              >
                                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={goNext}
                                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1.5 sm:p-2 text-white hover:bg-black"
                              >
                                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                              </button>
                            </>
                          )}
                        </>
                      ) : (
                        <div
                          className={`flex items-center justify-center w-full ${
                            deviceMode === "mobile"
                              ? "aspect-[9/16]"
                              : "aspect-[4/5]"
                          } text-slate-400 text-sm`}
                        >
                          No media
                        </div>
                      )}
                    </div>

                    {/* Thumbnails */}
                    {sortedAssets.length > 1 && (
                      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x">
                        {sortedAssets.map((a, i) => (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              setActiveIndex(i);
                              setIsZooming(false);
                            }}
                            className={`relative h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl border text-[10px] snap-start ${
                              i === activeIndex
                                ? "border-rose-500 ring-2 ring-rose-300"
                                : "border-slate-300"
                            }`}
                          >
                            {isImage(a) && (
                              <img
                                src={a.url}
                                className="h-full w-full object-cover"
                              />
                            )}
                            {isVideo(a) && (
                              <div className="flex h-full w-full items-center justify-center bg-black text-white text-[10px]">
                                VIDEO
                              </div>
                            )}
                            {is3D(a) && (
                              <div className="flex h-full w-full items-center justify-center bg-slate-200 text-slate-700 font-semibold text-[10px]">
                                3D
                              </div>
                            )}
                            {a.is_primary && (
                              <span className="absolute left-0.5 top-0.5 rounded-full bg-emerald-600 px-1 py-[1px] text-[8px] sm:text-[9px] font-semibold text-white">
                                Primary
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* RIGHT: DETAILS */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-serif font-semibold">
                        {product.title}
                      </h1>
                      {product.short_description && (
                        <p className="mt-1 text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-300">
                          {product.short_description}
                        </p>
                      )}
                      <RatingStarsMini />
                    </div>

                    <PriceTagMini
                      price={product.price}
                      currency={product.currency}
                    />

                    <div className="flex flex-wrap gap-2 mt-2">
                      <button className="px-3 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900">
                        Add to Cart
                      </button>
                      <button className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 flex items-center gap-1 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800">
                        <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Wishlist</span>
                      </button>
                      <button className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm rounded-xl flex items-center gap-1 text-slate-600 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800">
                        <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Notify Me</span>
                      </button>
                    </div>

                    <div className="grid gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
                      <div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Product Details
                        </div>
                        <ul className="mt-1 space-y-1">
                          <li>
                            SKU:{" "}
                            {(product.sku || product.id.slice(0, 8)).toUpperCase()}
                          </li>
                          {typeof product.available_qty === "number" && (
                            <li>
                              Available Qty:{" "}
                              {Math.max(product.available_qty || 0, 0)}
                            </li>
                          )}
                          {product.trade_type && (
                            <li>Trade: {product.trade_type.toUpperCase()}</li>
                          )}
                        </ul>
                      </div>

                      <div>
                        <div className="text-[10px] sm:text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Shipping & Care
                        </div>
                        <ul className="mt-1 space-y-1">
                          <li className="flex items-center gap-2">
                            <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-400" />
                            <span>Insured worldwide shipping</span>
                          </li>
                          <li>Secure payments & certification</li>
                          <li>Dedicated concierge support</li>
                        </ul>
                      </div>
                    </div>

                    {product.description && (
                      <div className="mt-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 shadow-sm p-2 sm:p-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200">
                        <div className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Description
                        </div>
                        <p className="mt-1 whitespace-pre-line">
                          {product.description}
                        </p>
                      </div>
                    )}

                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Note: Images and 3D models are for representation only.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProductPreview;