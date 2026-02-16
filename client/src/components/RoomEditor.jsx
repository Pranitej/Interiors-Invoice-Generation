import { useEffect, useCallback, useState } from "react";
import ROOM_CONFIG_JSON from "../json/roomConfig.json";
import { formatINR } from "../utils/calculations";

// Rooms config and sensible defaults
const ROOM_CONFIG = ROOM_CONFIG_JSON.rooms || [];
const GLOBAL_DEFAULT = ROOM_CONFIG_JSON.defaultDimensions || {
  height: 9,
  width: 1,
  depth: 1,
};

const OTHER_SENTINEL = "__OTHER__";

// -----------------------------------------
// NORMALIZATION
// -----------------------------------------
function normalizeToStructured(item = {}) {
  if (item.frame && item.box) {
    return {
      name: item.name || "",
      frame: {
        height: Number(item.frame.height || 0),
        width: Number(item.frame.width || 0),
        area: Number(item.frame.area || 0),
        price: Number(item.frame.price || 0),
      },
      box: {
        height: Number(item.box.height || 0),
        width: Number(item.box.width || 0),
        depth: Number(item.box.depth ?? GLOBAL_DEFAULT.depth),
        area: Number(item.box.area || 0),
        price: Number(item.box.price || 0),
      },
      totalPrice: Number(item.totalPrice || 0),
    };
  }

  // old structure fallback
  const h = Number(item.height ?? GLOBAL_DEFAULT.height);
  const w = Number(item.width ?? GLOBAL_DEFAULT.width);
  const d = Number(item.depth ?? GLOBAL_DEFAULT.depth);
  const workType = item.workType || "frame";

  if (workType === "frame") {
    const area = h * w;
    return {
      name: item.name || "",
      frame: { height: h, width: w, area, price: 0 },
      box: { height: 0, width: 0, depth: 0, area: 0, price: 0 },
      totalPrice: 0,
    };
  }

  const boxArea = h * w * d;
  return {
    name: item.name || "",
    frame: { height: 0, width: 0, area: 0, price: 0 },
    box: { height: h, width: w, depth: d, area: boxArea, price: 0 },
    totalPrice: 0,
  };
}

// -----------------------------------------
// CALCULATOR
// -----------------------------------------
function calcDiversified(item = {}, frameRate = 0, boxRateInput) {
  const fr = Number(frameRate) || 0;
  const br =
    typeof boxRateInput === "number" && !Number.isNaN(boxRateInput)
      ? boxRateInput
      : fr * 1.4;

  const fh = Number(item.frame?.height || 0);
  const fw = Number(item.frame?.width || 0);
  const bh = Number(item.box?.height || 0);
  const bw = Number(item.box?.width || 0);
  const bd = Number(item.box?.depth || 0);

  const frameArea = fh * fw;
  const boxArea = bh * bw * bd;

  const framePrice = frameArea * fr;
  const boxPrice = boxArea * br;

  return {
    name: item.name || "",
    frame: {
      height: fh,
      width: fw,
      area: frameArea,
      price: framePrice,
    },
    box: {
      height: bh,
      width: bw,
      depth: bd,
      area: boxArea,
      price: boxPrice,
    },
    totalPrice: framePrice + boxPrice,
  };
}

// -----------------------------------------
// COMPONENT START
// -----------------------------------------
export default function RoomEditor({
  room,
  onChange = () => {},
  onRemoveRoom,
  globalFrameRate,
  globalBoxRate,
}) {
  const [collapsedItems, setCollapsedItems] = useState({});
  const [isRoomCollapsed, setIsRoomCollapsed] = useState(false);

  // normalize
  const safeRoom = {
    name: room.name || "",
    description: room.description || "",
    frameRate: Number(room.frameRate || 0),
    boxRate:
      typeof room.boxRate === "number"
        ? Number(room.boxRate)
        : Number(room.frameRate || 0) * 1.4,
    items: (room.items || []).map(normalizeToStructured),
    accessories: room.accessories || [],
  };

  const isKnownRoom = ROOM_CONFIG.some((r) => r.name === safeRoom.name);

  const roomSelectValue =
    safeRoom.name === OTHER_SENTINEL
      ? "Other"
      : !safeRoom.name
        ? ""
        : isKnownRoom
          ? safeRoom.name
          : "Other";

  const roomConfig = ROOM_CONFIG.find((r) => r.name === safeRoom.name) ||
    ROOM_CONFIG.find((r) => r.name === "Other") || {
      items: [],
      descriptions: [],
      accessories: [],
    };

  // -----------------------------------------
  // RECALCULATE ITEMS WHEN rate or items change
  // -----------------------------------------
  useEffect(() => {
    const recalculated = safeRoom.items.map((it) =>
      calcDiversified(it, safeRoom.frameRate, safeRoom.boxRate),
    );

    if (JSON.stringify(recalculated) !== JSON.stringify(room.items)) {
      onChange({ ...safeRoom, items: recalculated });
    }
  }, [
    safeRoom,
    onChange,
    safeRoom.frameRate,
    safeRoom.boxRate,
    room.items,
    globalFrameRate,
    globalBoxRate,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // -----------------------------------------
  // ITEM UPDATE
  // -----------------------------------------
  const updateItem = useCallback(
    (index, changes) => {
      const items = [...safeRoom.items];
      let base = { ...items[index] };

      // Change name → load defaults
      if (typeof changes.name === "string" && changes.name !== base.name) {
        const cfg =
          roomConfig.items?.find((i) => i.name === changes.name) || {};
        const f = cfg.defaultFrame || {};
        const b = cfg.defaultBox || {};

        base = {
          name: changes.name,
          frame: {
            height: Number(f.height ?? GLOBAL_DEFAULT.height),
            width: Number(f.width ?? GLOBAL_DEFAULT.width),
            area: 0,
            price: 0,
          },
          box: {
            height: Number(b.height ?? GLOBAL_DEFAULT.height),
            width: Number(b.width ?? GLOBAL_DEFAULT.width),
            depth: Number(b.depth ?? GLOBAL_DEFAULT.depth),
            area: 0,
            price: 0,
          },
          totalPrice: 0,
        };
      } else {
        // update dims
        base = {
          ...base,
          frame: { ...base.frame, ...(changes.frame || {}) },
          box: { ...base.box, ...(changes.box || {}) },
        };
      }

      items[index] = calcDiversified(
        base,
        safeRoom.frameRate,
        safeRoom.boxRate,
      );
      onChange({ ...safeRoom, items });
    },
    [safeRoom, roomConfig, onChange],
  );

  const addItem = useCallback(() => {
    onChange({
      ...safeRoom,
      items: [
        ...safeRoom.items,
        normalizeToStructured({ height: 0, width: 0, depth: 0 }),
      ],
    });
  }, [safeRoom, onChange]);

  const removeItem = (index) => {
    onChange({
      ...safeRoom,
      items: safeRoom.items.filter((_, i) => i !== index),
    });
  };

  const toggleItemCollapse = (index) => {
    setCollapsedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // -----------------------------------------
  // ACCESSORIES
  // -----------------------------------------
  const addAccessory = () => {
    onChange({
      ...safeRoom,
      accessories: [...safeRoom.accessories, { name: "", price: 0, qty: 1 }],
    });
  };

  const updateAccessory = (i, changes) => {
    const acc = [...safeRoom.accessories];
    acc[i] = { ...acc[i], ...changes };
    onChange({ ...safeRoom, accessories: acc });
  };

  const removeAccessory = (i) => {
    onChange({
      ...safeRoom,
      accessories: safeRoom.accessories.filter((_, x) => x !== i),
    });
  };

  const roomTotal =
    safeRoom.items.reduce((s, it) => s + it.totalPrice, 0) +
    safeRoom.accessories.reduce((s, a) => s + a.price * a.qty, 0);

  // -----------------------------------------
  // COMPACT, RESPONSIVE UI
  // -----------------------------------------
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      {/* Room Header - Compact with Collapse */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setIsRoomCollapsed(!isRoomCollapsed)}
              className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
            >
              <svg
                className={`w-4 h-4 text-blue-600 dark:text-blue-400 transition-transform ${
                  isRoomCollapsed ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-800 dark:text-white truncate">
                {safeRoom.name || "Untitled Room"}
              </h3>

              {/* Desktop: Single line */}
              <div className="hidden sm:block">
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {safeRoom.description || "No description"} •{" "}
                  <span className="font-medium">
                    {safeRoom.items.length} items
                  </span>{" "}
                  •{" "}
                  <span className="font-medium">
                    {safeRoom.accessories.length} accessories
                  </span>{" "}
                  •{" "}
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatINR(roomTotal)}
                  </span>
                </p>
              </div>

              {/* Mobile: Vertical stack */}
              <div className="sm:hidden space-y-0.5">
                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {safeRoom.description || "No description"}
                </p>

                {/* Stats row */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                    {safeRoom.items.length} i
                  </span>
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">
                    {safeRoom.accessories.length} a
                  </span>
                  <span className=" font-semibold text-green-600 dark:text-green-400">
                    {formatINR(roomTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRemoveRoom}
              className="p-2 sm:px-3 sm:py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium flex items-center justify-center"
              title="Remove Room"
            >
              <svg
                className="w-4 h-4 sm:mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
        </div>
      </div>

      {/* Room Content - Collapsible */}
      {!isRoomCollapsed && (
        <div className="p-3">
          {/* Room Configuration - Improved Alignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            {/* Room Type Section */}
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Type
              </label>

              {/* Container for room type input(s) */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div
                  className={`${roomSelectValue === "Other" ? "sm:w-1/2" : "w-full"}`}
                >
                  <select
                    value={roomSelectValue}
                    onChange={(e) =>
                      onChange({
                        ...safeRoom,
                        name:
                          e.target.value === "Other"
                            ? OTHER_SENTINEL
                            : e.target.value,
                        description: "",
                      })
                    }
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
                  >
                    <option value="">Select Room Type</option>
                    {ROOM_CONFIG.map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Other Input - only shows when "Other" is selected */}
                {roomSelectValue === "Other" && (
                  <div className="sm:w-1/2">
                    <input
                      type="text"
                      placeholder="Enter room name"
                      value={
                        safeRoom.name === OTHER_SENTINEL ? "" : safeRoom.name
                      }
                      onChange={(e) =>
                        onChange({
                          ...safeRoom,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <select
                value={safeRoom.description}
                onChange={(e) =>
                  onChange({ ...safeRoom, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
              >
                <option value="">Select Description</option>
                {(roomConfig.descriptions || []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rates - Compact Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Frame Rate (₹/sqft)
              </label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={safeRoom.frameRate}
                  onChange={(e) => {
                    const newFrame = Number(e.target.value || 0);
                    onChange({
                      ...safeRoom,
                      frameRate: newFrame,
                      boxRate: newFrame * 1.4,
                    });
                  }}
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Box Rate (₹/sqft)
              </label>
              <div className="relative">
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
                  ₹
                </div>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={safeRoom.boxRate}
                  onChange={(e) =>
                    onChange({
                      ...safeRoom,
                      boxRate: Number(e.target.value || 0),
                    })
                  }
                  className="w-full pl-7 pr-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Items Section Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                Items ({safeRoom.items.length})
              </h4>
              {safeRoom.items.length > 0 && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                  {formatINR(
                    safeRoom.items.reduce((s, it) => s + it.totalPrice, 0),
                  )}
                </span>
              )}
            </div>
            <button
              onClick={addItem}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Item
            </button>
          </div>

          {/* Items List - Compact */}
          {safeRoom.items.length > 0 ? (
            <div className="space-y-2 mb-4">
              {safeRoom.items.map((item, i) => {
                const isKnownItem = (roomConfig.items || []).some(
                  (opt) => opt.name === item.name,
                );

                const itemSelectValue =
                  item.name === OTHER_SENTINEL
                    ? "Other"
                    : !item.name
                      ? ""
                      : isKnownItem
                        ? item.name
                        : "Other";

                return (
                  <div
                    key={i}
                    className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg overflow-visible"
                  >
                    {/* Item Header */}
                    <div
                      className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                      onClick={() => toggleItemCollapse(i)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
                          {/* Collapsed → Static name */}
                          {collapsedItems[i] ? (
                            <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-white">
                              {item.name || "Select Item"}
                            </span>
                          ) : (
                            <div>
                              {/* Item Name Label */}
                              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Item name
                              </label>

                              {/* Container for item selection */}
                              <div className="flex flex-col sm:flex-row gap-2">
                                {/* Select dropdown container */}
                                <div
                                  className={`${itemSelectValue === "Other" ? "sm:w-1/2" : "w-full"}`}
                                >
                                  <select
                                    value={itemSelectValue}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) =>
                                      updateItem(i, {
                                        name:
                                          e.target.value === "Other"
                                            ? OTHER_SENTINEL
                                            : e.target.value,
                                      })
                                    }
                                    className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white appearance-none transition-all duration-300 ease-out focus:outline-none focus:border-transparent focus:shadow-[0_0_0_1px_rgba(59,130,246,0.35)] hover:border-blue-400"
                                  >
                                    <option value="">Select Item</option>
                                    {(roomConfig.items || []).map((opt) => (
                                      <option key={opt.name} value={opt.name}>
                                        {opt.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Other Input - only shows when "Other" is selected */}
                                {itemSelectValue === "Other" && (
                                  <div className="sm:w-1/2">
                                    <input
                                      type="text"
                                      placeholder="Enter item name"
                                      value={
                                        item.name === OTHER_SENTINEL
                                          ? ""
                                          : item.name
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                      onChange={(e) =>
                                        updateItem(i, { name: e.target.value })
                                      }
                                      className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-transparent focus:shadow-[0_0_0_1px_rgba(59,130,246,0.35)]"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {formatINR(item.totalPrice)}
                            </span>
                            <svg
                              className={`w-3 h-3 text-gray-500 transition-transform ${
                                collapsedItems[i] ? "rotate-180" : ""
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Item Content */}
                    {!collapsedItems[i] && (
                      <div className="p-3">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {/* Frame */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                  Frame
                                </span>
                              </div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">
                                {item.frame.area.toFixed(1)} sqft
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Width (ft)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.frame.width}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      frame: { width: Number(e.target.value) },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Height (ft)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.frame.height}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      frame: { height: Number(e.target.value) },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800/30">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Price:
                                </span>
                                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                  {formatINR(item.frame.price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Box */}
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                  Box
                                </span>
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400">
                                {item.box.area.toFixed(1)} sqft
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Width (ft)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.box.width}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      box: { width: Number(e.target.value) },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Height (ft)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.box.height}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      box: { height: Number(e.target.value) },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white"
                                />
                              </div>

                              <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                  Depth (ft)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.box.depth}
                                  onChange={(e) =>
                                    updateItem(i, {
                                      box: {
                                        depth:
                                          e.target.value === ""
                                            ? ""
                                            : Number(e.target.value),
                                      },
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500 text-gray-900 dark:text-white"
                                />
                              </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-green-200 dark:border-green-800/30">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600 dark:text-gray-400">
                                  Price:
                                </span>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                  {formatINR(item.box.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Item Footer */}
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Frame: {item.frame.area.toFixed(2)} sqft • Box:{" "}
                            {item.box.area.toFixed(2)} sqft
                          </div>
                          <button
                            onClick={() => removeItem(i)}
                            className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg mb-4">
              <svg
                className="w-8 h-8 text-gray-400 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No items added yet
              </p>
            </div>
          )}
          {safeRoom.items.length > 0 && (
            <button
              onClick={addItem}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors mb-3"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Add Another Item
            </button>
          )}

          {/* Accessories Section */}
          {roomConfig.accessories.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Accessories ({safeRoom.accessories.length})
                </h4>
                <button
                  onClick={addAccessory}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm transition-colors"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add
                </button>
              </div>

              {safeRoom.accessories.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {safeRoom.accessories.map((acc, i) => {
                    const total = acc.price * acc.qty;
                    return (
                      <div
                        key={i}
                        className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800/30 rounded-lg p-3"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-2">
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Accessory
                            </label>
                            <select
                              value={acc.name}
                              onChange={(e) => {
                                const selected = roomConfig.accessories.find(
                                  (a) => a.name === e.target.value,
                                );
                                if (!selected) return;
                                updateAccessory(i, {
                                  name: selected.name,
                                  price: selected.price,
                                });
                              }}
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white"
                            >
                              <option value="">Select Accessory</option>
                              {roomConfig.accessories.map((a) => (
                                <option key={a.name} value={a.name}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Price
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={acc.price}
                              onChange={(e) =>
                                updateAccessory(i, {
                                  price: Number(e.target.value || 0),
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Qty
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={acc.qty}
                                onChange={(e) =>
                                  updateAccessory(i, {
                                    qty: Number(e.target.value || 0),
                                  })
                                }
                                className="flex-1 px-2 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-white"
                              />
                              <button
                                onClick={() => removeAccessory(i)}
                                className="px-2 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800/30">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              Total:
                            </span>
                            <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                              {formatINR(total)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg mb-4">
                  <p className="text-sm text-purple-600 dark:text-purple-400">
                    No accessories added
                  </p>
                </div>
              )}
            </>
          )}

          {/* Room Total */}
          <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Room Total
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {safeRoom.items.length} items • {safeRoom.accessories.length}{" "}
                  accessories
                </div>
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatINR(roomTotal)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
