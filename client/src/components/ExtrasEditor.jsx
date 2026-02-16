import React, { useState } from "react";
import ROOM_CONFIG from "../json/roomConfig";
import { formatINR } from "../utils/calculations";

export default function ExtrasEditor({ extras, setExtras }) {
  const extrasConfig = ROOM_CONFIG.extras || [];
  const [collapsedExtras, setCollapsedExtras] = useState({});

  /* -----------------------------------------
      SAFE INPUT NORMALIZER
  ----------------------------------------- */
  const safeInputs = (inputs = {}) => ({
    surfaces: Array.isArray(inputs.surfaces) ? inputs.surfaces : [],
    electricalWiring: Number(inputs.electricalWiring ?? 0),
    electricianCharges: Number(inputs.electricianCharges ?? 0),
    ceilingLights: Number(inputs.ceilingLights ?? 0),
    profileLights: Number(inputs.profileLights ?? 0),
    ceilingPaintingArea:
      inputs.ceilingPaintingArea === "" || inputs.ceilingPaintingArea == null
        ? 0
        : Number(inputs.ceilingPaintingArea),
    ceilingPaintingUnitPrice:
      inputs.ceilingPaintingUnitPrice === "" ||
      inputs.ceilingPaintingUnitPrice == null
        ? 0
        : Number(inputs.ceilingPaintingUnitPrice),
    ceilingPaintingPrice:
      inputs.ceilingPaintingPrice === "" || inputs.ceilingPaintingPrice == null
        ? 0
        : Number(inputs.ceilingPaintingPrice),
    area: inputs.area === "" || inputs.area == null ? "" : Number(inputs.area),
    unitPrice:
      inputs.unitPrice === "" || inputs.unitPrice == null
        ? 0
        : Number(inputs.unitPrice),
    price:
      inputs.price === "" || inputs.price == null ? 0 : Number(inputs.price),
  });

  const getExtraConfig = (key) => extrasConfig.find((e) => e.key === key);

  const findSlab = (totalArea, slabs) => {
    if (!slabs?.length) return null;
    let slab = slabs.find((s) => totalArea >= s.min && totalArea <= s.max);
    return slab || slabs[slabs.length - 1];
  };

  /* -----------------------------------------
      CEILING CALCULATOR (FIXED)
  ----------------------------------------- */
  const computeCeilingFromSurfaces = (
    cfg,
    inputs,
    { forceRecalcPaintingArea = false, updateFromSlab = false } = {}
  ) => {
    const surfaces = inputs.surfaces || [];
    const normalized = surfaces.map((s) => {
      const area = Number(s.area || 0);
      const unitPrice = Number(s.unitPrice || 0);
      return {
        ...s,
        area,
        unitPrice,
        price: area * unitPrice,
      };
    });

    const totalArea = normalized.reduce((t, s) => t + s.area, 0);
    const surfacePrice = normalized.reduce((t, s) => t + s.price, 0);
    const slab = findSlab(totalArea, cfg.slabs);

    // Start with current values
    let wiring = Number(inputs.electricalWiring || 0);
    let charges = Number(inputs.electricianCharges || 0);
    let lights = Number(inputs.ceilingLights || 0);
    let profile = Number(inputs.profileLights || 0);

    // Only apply slab values if explicitly requested AND slab exists
    if (updateFromSlab && slab) {
      wiring = Number(slab.electricalWiring || 0);
      charges = Number(slab.electricianCharges || 0);
      lights = Number(slab.ceilingLights || 0);
      profile = Number(slab.profileLights || 0);
    }

    const sgArea = normalized.find((s) => s.type === "saint_gobain")?.area || 0;
    const popArea = normalized.find((s) => s.type === "pop")?.area || 0;
    const defaultPaintingArea = sgArea + popArea;
    const defaultPaintingUnit =
      cfg.ceilingPainting?.unitPrice != null
        ? Number(cfg.ceilingPainting.unitPrice)
        : 0;

    let paintingArea;
    let paintingUnitPrice;

    if (forceRecalcPaintingArea) {
      paintingArea = defaultPaintingArea;
      paintingUnitPrice =
        inputs.ceilingPaintingUnitPrice && inputs.ceilingPaintingUnitPrice > 0
          ? Number(inputs.ceilingPaintingUnitPrice)
          : defaultPaintingUnit;
    } else {
      paintingArea =
        inputs.ceilingPaintingArea && inputs.ceilingPaintingArea > 0
          ? Number(inputs.ceilingPaintingArea)
          : defaultPaintingArea;
      paintingUnitPrice =
        inputs.ceilingPaintingUnitPrice && inputs.ceilingPaintingUnitPrice > 0
          ? Number(inputs.ceilingPaintingUnitPrice)
          : defaultPaintingUnit;
    }

    const paintingPrice = paintingArea * paintingUnitPrice;
    const slabCharges = wiring + charges + lights + profile;

    return {
      inputs: {
        ...inputs,
        surfaces: normalized,
        electricalWiring: wiring,
        electricianCharges: charges,
        ceilingLights: lights,
        profileLights: profile,
        ceilingPaintingArea: paintingArea,
        ceilingPaintingUnitPrice: paintingUnitPrice,
        ceilingPaintingPrice: paintingPrice,
      },
      total: surfacePrice + slabCharges + paintingPrice,
    };
  };

  /* -----------------------------------------
      HANDLERS
  ----------------------------------------- */
  const toggleExtraCollapse = (id) => {
    setCollapsedExtras((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const removeExtra = (id) => {
    setExtras(extras.filter((e) => e.id !== id));
  };

  const handleSelectExtra = (key) => {
    if (!key) return;
    const cfg = getExtraConfig(key);
    if (!cfg) return;
    if (extras.some((ex) => ex.key === key)) return;

    let inputs = safeInputs({});
    let total = 0;
    let computed = null;

    if (cfg.type === "ceiling") {
      const sg = cfg.surfaces.find((s) => s.key === "saint_gobain");
      if (sg) {
        inputs.surfaces = [
          {
            type: sg.key,
            label: sg.label,
            area: "",
            unitPrice: sg.unitPrice,
            price: 0,
          },
        ];
      }
      computed = computeCeilingFromSurfaces(cfg, inputs, {
        forceRecalcPaintingArea: true,
        updateFromSlab: true,
      });
      inputs = computed.inputs;
      total = computed.total;
    } else if (cfg.type === "area_based") {
      inputs.unitPrice = cfg.unitPrice || 0;
      inputs.area = inputs.area || 0;
      total = Number(inputs.area || 0) * Number(inputs.unitPrice || 0);
    } else if (cfg.type === "fixed") {
      inputs.price = cfg.price || 0;
      total = Number(inputs.price || 0);
    }

    const newExtra = {
      id: Date.now(),
      key: cfg.key,
      label: cfg.label,
      type: cfg.type,
      inputs,
      total,
    };

    setExtras([...extras, newExtra]);
  };

  const updateField = (id, type, value) => {
    setExtras(
      extras.map((ex) => {
        if (ex.id !== id) return ex;
        const cfg = getExtraConfig(ex.key);
        let inputs = safeInputs(ex.inputs);
        let updateFromSlab = false;

        if (ex.type === "ceiling") {
          let forceRecalcPaintingArea = false;

          if (type === "surface_area") {
            inputs.surfaces[value.index].area = value.area;
            forceRecalcPaintingArea = true;
            updateFromSlab = true; // Update from slab when area changes
          }

          if (type === "surface_unitPrice") {
            inputs.surfaces[value.index].unitPrice = value.unitPrice;
          }

          // Direct field updates - these should NOT trigger slab recalculation
          if (type === "electricalWiring") {
            inputs.electricalWiring = Number(value || 0);
          }
          if (type === "electricianCharges") {
            inputs.electricianCharges = Number(value || 0);
          }
          if (type === "ceilingLights") {
            inputs.ceilingLights = Number(value || 0);
          }
          if (type === "profileLights") {
            inputs.profileLights = Number(value || 0);
          }
          if (type === "paintingArea") {
            inputs.ceilingPaintingArea = Number(value || 0);
          }
          if (type === "paintingUnitPrice") {
            inputs.ceilingPaintingUnitPrice = Number(value || 0);
          }

          const computed = computeCeilingFromSurfaces(cfg, inputs, {
            forceRecalcPaintingArea,
            updateFromSlab,
          });
          return { ...ex, inputs: computed.inputs, total: computed.total };
        }

        if (ex.type === "area_based") {
          if (type === "area") inputs.area = Number(value || 0);
          if (type === "unitPrice") inputs.unitPrice = Number(value || 0);
          const total =
            Number(inputs.area || 0) * Number(inputs.unitPrice || 0);
          return { ...ex, inputs, total };
        }

        if (ex.type === "fixed") {
          inputs.price = Number(value || 0);
          return { ...ex, inputs, total: inputs.price };
        }

        return ex;
      })
    );
  };

  const addSurfaceByClick = (ex, surfaceKey) => {
    const cfg = getExtraConfig("ceiling");
    const next = cfg?.surfaces?.find((s) => s.key === surfaceKey);
    if (!next) return;

    const updatedSurfaces = [
      ...ex.inputs.surfaces,
      {
        type: next.key,
        label: next.label,
        area: "",
        unitPrice: next.unitPrice,
        price: 0,
      },
    ];

    setExtras(
      extras.map((e) => {
        if (e.id !== ex.id) return e;
        const baseInputs = safeInputs({
          ...e.inputs,
          surfaces: updatedSurfaces,
        });
        const computed = computeCeilingFromSurfaces(cfg, baseInputs, {
          forceRecalcPaintingArea: true,
          updateFromSlab: true,
        });
        return { ...e, inputs: computed.inputs, total: computed.total };
      })
    );
  };

  const removeSurface = (ex, index) => {
    const cfg = getExtraConfig("ceiling");
    const updatedSurfaces = ex.inputs.surfaces.filter((_, i) => i !== index);

    setExtras(
      extras.map((e) => {
        if (e.id !== ex.id) return e;
        const baseInputs = safeInputs({
          ...e.inputs,
          surfaces: updatedSurfaces,
        });
        const computed = computeCeilingFromSurfaces(cfg, baseInputs, {
          forceRecalcPaintingArea: true,
          updateFromSlab: true,
        });
        return { ...e, inputs: computed.inputs, total: computed.total };
      })
    );
  };

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + (Number(ex.total) || 0),
    0
  );

  /* -----------------------------------------
      COMPACT, RESPONSIVE UI
  ----------------------------------------- */
  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="w-full">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Additional Extras
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Add ceiling treatments, custom installations, or fixed-cost items
          </p>
        </div>

        {/* Add Extra Dropdown */}
        <div className="flex justify-end gap-2 w-full">
          {/* Mobile: Full width, Desktop: Fixed width */}
          <select
            className="flex-1 min-w-0 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white sm:w-auto sm:flex-none sm:min-w-[200px]"
            onChange={(e) => {
              handleSelectExtra(e.target.value);
              e.target.value = "";
            }}
          >
            <option value="" className="text-gray-500 dark:text-gray-400">
              + Add Extra
            </option>
            {extrasConfig.map((cfg) =>
              extras.some((e) => e.key === cfg.key) ? null : (
                <option key={cfg.key} value={cfg.key}>
                  {cfg.label}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Extras List */}
      {extras.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            No extras added yet
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs);
            const isCollapsed = collapsedExtras[ex.id];

            return (
              <div
                key={ex.id}
                className="bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                {/* Extra Header with Collapse */}
                <div
                  className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                  onClick={() => toggleExtraCollapse(ex.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <svg
                        className={`w-3 h-3 text-gray-500 transition-transform ${
                          isCollapsed ? "rotate-180" : ""
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-800 dark:text-white truncate">
                            {ex.label}
                          </h4>
                          <span
                            className={`px-1.5 py-0.5 rounded text-xs ${
                              ex.type === "ceiling"
                                ? "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                                : ex.type === "area_based"
                                ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                                : "bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                            }`}
                          >
                            {ex.type.replace("_", " ")}
                          </span>
                        </div>
                        {isCollapsed && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Total: {formatINR(ex.total)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        {formatINR(ex.total)}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeExtra(ex.id);
                        }}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 rounded"
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

                {/* Extra Content - Collapsible */}
                {!isCollapsed && (
                  <div className="p-3 space-y-3">
                    {/* CEILING EXTRA */}
                    {ex.type === "ceiling" && (
                      <div className="space-y-3">
                        {/* Add Surface Button */}
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Ceiling Surfaces
                          </h5>
                          <select
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                            onChange={(e) => {
                              if (!e.target.value) return;
                              addSurfaceByClick(ex, e.target.value);
                              e.target.value = "";
                            }}
                          >
                            <option value="" className="text-gray-500">
                              + Add Surface
                            </option>
                            {getExtraConfig("ceiling")
                              ?.surfaces.filter(
                                (s) =>
                                  !inputs.surfaces.some((u) => u.type === s.key)
                              )
                              .map((s) => (
                                <option key={s.key} value={s.key}>
                                  {s.label}
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* Surface Cards */}
                        <div className="space-y-2">
                          {inputs.surfaces.map((s, index) => (
                            <div
                              key={index}
                              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded p-2"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-medium text-gray-800 dark:text-white">
                                    {s.label}
                                  </span>
                                  <span className="text-[10px] px-1 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                                    Surface {index + 1}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeSurface(ex, index)}
                                  className="text-[10px] text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                >
                                  Remove
                                </button>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                                    Area (sqft)
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
                                    value={s.area}
                                    onChange={(e) =>
                                      updateField(ex.id, "surface_area", {
                                        index,
                                        area: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                                    Unit Price
                                  </label>
                                  <input
                                    type="number"
                                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
                                    value={s.unitPrice}
                                    onChange={(e) =>
                                      updateField(ex.id, "surface_unitPrice", {
                                        index,
                                        unitPrice: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>

                                <div className="sm:col-span-1 col-span-2 flex justify-between items-center sm:block">
                                  <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Subtotal:
                                  </div>
                                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                    {formatINR(s.price)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Electrical & Lighting Section */}
                        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded p-3">
                          <h5 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                            Electrical & Lighting
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              {
                                key: "electricalWiring",
                                label: "Wiring",
                              },
                              {
                                key: "electricianCharges",
                                label: "Electrician",
                              },
                              { key: "ceilingLights", label: "Ceiling Lights" },
                              { key: "profileLights", label: "Profile Lights" },
                            ].map(({ key, label }) => (
                              <div key={key}>
                                <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                                  {label}
                                </label>
                                <input
                                  type="number"
                                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
                                  value={inputs[key]}
                                  onChange={(e) =>
                                    updateField(
                                      ex.id,
                                      key,
                                      Number(e.target.value)
                                    )
                                  }
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Ceiling Painting Section */}
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 rounded p-3">
                          <h5 className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                            Ceiling Painting
                          </h5>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                                Painting Area (sqft)
                              </label>
                              <input
                                type="number"
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500"
                                value={inputs.ceilingPaintingArea}
                                onChange={(e) =>
                                  updateField(
                                    ex.id,
                                    "paintingArea",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                                Unit Price
                              </label>
                              <input
                                type="number"
                                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-green-500"
                                value={inputs.ceilingPaintingUnitPrice}
                                onChange={(e) =>
                                  updateField(
                                    ex.id,
                                    "paintingUnitPrice",
                                    Number(e.target.value)
                                  )
                                }
                              />
                            </div>

                            <div className="flex justify-between items-center sm:block">
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                                Painting:
                              </div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                {formatINR(inputs.ceilingPaintingPrice || 0)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* AREA BASED EXTRA */}
                    {ex.type === "area_based" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Area (sqft)
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            value={inputs.area}
                            onChange={(e) =>
                              updateField(ex.id, "area", Number(e.target.value))
                            }
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Unit Price
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-green-500 focus:border-green-500"
                            value={inputs.unitPrice}
                            onChange={(e) =>
                              updateField(
                                ex.id,
                                "unitPrice",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-col justify-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Calculated Total
                          </div>
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {formatINR(ex.total)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FIXED EXTRA */}
                    {ex.type === "fixed" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Fixed Price
                          </label>
                          <input
                            type="number"
                            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            value={inputs.price}
                            onChange={(e) =>
                              updateField(
                                ex.id,
                                "price",
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>

                        <div className="flex flex-col justify-center">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Item Total
                          </div>
                          <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                            {formatINR(ex.total)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Extras Total Summary */}
      {extras.length > 0 && (
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Extras Total
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {extras.length} {extras.length === 1 ? "extra" : "extras"}
              </div>
            </div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {formatINR(extrasTotal)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
