// src/components/ClientInvoice.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoice = forwardRef(({ invoice }, ref) => {
  if (!invoice) return null;

  const client = invoice.client || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const extras = Array.isArray(invoice.extras) ? invoice.extras : [];
  const pricing = invoice.pricing || {};
  const discount = Number(invoice.discount || 0);
  const finalPayableFromApi = Number(invoice.finalPayable || 0);

  const frameworkRate =
    typeof pricing.frameRate === "number" ? pricing.frameRate : 0;
  const boxRate =
    typeof pricing.boxRate === "number" ? pricing.boxRate : frameworkRate * 1.4;

  const safeInputs = (inputs) => ({
    surfaces: inputs?.surfaces || [],
    electricalWiring: inputs?.electricalWiring ?? 0,
    electricianCharges: inputs?.electricianCharges ?? 0,
    ceilingLights: inputs?.ceilingLights ?? 0,
    profileLights: inputs?.profileLights ?? 0,
    ceilingPaintingArea: inputs?.ceilingPaintingArea ?? 0,
    ceilingPaintingUnitPrice: inputs?.ceilingPaintingUnitPrice ?? 0,
    ceilingPaintingPrice: inputs?.ceilingPaintingPrice ?? 0,
    area: inputs?.area ?? 0,
    unitPrice: inputs?.unitPrice ?? 0,
    price: inputs?.price ?? 0,
  });

  const calcRoomAggregates = (room = {}) => {
    const items = room.items || [];
    const accessories = room.accessories || [];

    let frameAreaTotal = 0;
    let boxAreaTotal = 0;
    let framePriceTotal = 0;
    let boxPriceTotal = 0;

    items.forEach((item) => {
      frameAreaTotal += Number(item.frame?.area || 0);
      boxAreaTotal += Number(item.box?.area || 0);
      framePriceTotal += Number(item.frame?.price || 0);
      boxPriceTotal += Number(item.box?.price || 0);
    });

    const accessoriesTotal = accessories.reduce(
      (sum, a) => sum + Number(a.price || 0) * Number(a.qty || 0),
      0,
    );

    const itemsTotal = framePriceTotal + boxPriceTotal;
    const roomTotal = itemsTotal + accessoriesTotal;

    return {
      frameAreaTotal,
      boxAreaTotal,
      framePriceTotal,
      boxPriceTotal,
      accessoriesTotal,
      itemsTotal,
      roomTotal,
      accessories,
    };
  };

  const roomsTotals = rooms.map((room) => calcRoomAggregates(room));
  const roomsTotal = roomsTotals.reduce((sum, r) => sum + r.roomTotal, 0);

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + Number(ex.total || 0),
    0,
  );

  const grandTotal =
    typeof invoice.grandTotal === "number"
      ? invoice.grandTotal
      : roomsTotal + extrasTotal;

  const safeDiscount = Math.min(discount, grandTotal);

  const finalPayable =
    finalPayableFromApi > 0 ? finalPayableFromApi : grandTotal - safeDiscount;

  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const calculateItemTotal = (item = {}) => {
    const framePrice = Number(item.frame?.price || 0);
    const boxPrice = Number(item.box?.price || 0);
    return framePrice + boxPrice;
  };

  const calculateRoomTotal = (room = {}) => {
    const itemsTotal = (room.items || []).reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0,
    );
    const accessoriesTotal = (room.accessories || []).reduce(
      (sum, acc) => sum + (acc.price || 0) * (acc.qty || 0),
      0,
    );
    return itemsTotal + accessoriesTotal;
  };

  const invoiceIdShort = invoice._id
    ? `INV-${String(invoice._id).slice(-6).toUpperCase()}`
    : "";

  /* ========================================================= */
  /* STYLE CONSTANTS                                           */
  /* ========================================================= */

  const s = {
    // Root wrapper
    // "bg-white text-black p-4 text-xs w-full max-w-none min-w-full"
    // + inline style: width 800px, fontFamily
    root: {
      backgroundColor: "#ffffff",
      color: "#000000",
      padding: "16px",
      fontSize: "12px",
      width: "800px",
      maxWidth: "none",
      minWidth: "100%",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    },

    // ── Header ──────────────────────────────────────────────
    // "border-b-2 border-gray-800 pb-3 mb-4"
    header: {
      borderBottom: "2px solid #1f2937",
      paddingBottom: "12px",
      marginBottom: "16px",
    },
    // "flex justify-between items-start"
    headerInner: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    // "flex items-start gap-3"
    headerLeft: {
      display: "flex",
      alignItems: "flex-start",
      gap: "12px",
    },
    // "w-16 h-16 flex-shrink-0 mt-1"
    logoContainer: {
      width: "64px",
      height: "64px",
      flexShrink: 0,
      marginTop: "4px",
    },
    // "w-full h-full object-contain"
    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    // "text-2xl font-bold tracking-tight"
    companyName: {
      fontSize: "24px",
      fontWeight: "700",
      letterSpacing: "-0.025em",
      margin: 0,
    },
    // "text-[10px] text-gray-600 leading-tight mt-1"
    companyAddressLine: {
      fontSize: "10px",
      color: "#4b5563",
      lineHeight: "1.25",
      marginTop: "4px",
      marginBottom: 0,
    },
    // "text-[10px] text-gray-600"
    companyInfoLine: {
      fontSize: "10px",
      color: "#4b5563",
      margin: 0,
    },
    // "font-medium"
    infoLabel: {
      fontWeight: "500",
    },

    // ── Generic spacing ──────────────────────────────────────
    // "mb-4"
    mb4: { marginBottom: "16px" },
    // "mb-3"
    mb3: { marginBottom: "12px" },
    // "mb-2"
    mb2: { marginBottom: "8px" },
    // "mb-1"
    mb1: { marginBottom: "4px" },

    // ── Shared table base ────────────────────────────────────
    // "w-full border-collapse text-[11px]"
    table11: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
    },
    // "w-full border-collapse text-[10px] mb-1"
    table10mb1: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "10px",
      marginBottom: "4px",
    },
    // "w-full text-[10px] border"
    table10border: {
      width: "100%",
      fontSize: "10px",
      border: "1px solid #d1d5db",
      borderCollapse: "collapse",
    },

    // ── thead row backgrounds ────────────────────────────────
    // "bg-gray-100"
    bgGray100: { backgroundColor: "#f3f4f6" },
    // "bg-gray-50"
    bgGray50: { backgroundColor: "#f9fafb" },

    // ── th / td shared ───────────────────────────────────────
    // "p-1.5 text-left font-bold border border-gray-300"
    thSectionHeader: {
      padding: "6px",
      textAlign: "left",
      fontWeight: "700",
      border: "1px solid #d1d5db",
    },
    // "p-1.5 border border-gray-300 font-medium"
    tdLabel: {
      padding: "6px",
      border: "1px solid #d1d5db",
      fontWeight: "500",
    },
    // "p-1.5 border border-gray-300"
    tdValue: {
      padding: "6px",
      border: "1px solid #d1d5db",
    },
    // "p-1.5 border border-gray-300 font-semibold"
    tdValueSemibold: {
      padding: "6px",
      border: "1px solid #d1d5db",
      fontWeight: "600",
    },
    // "p-1.5 border border-gray-300 text-center"
    tdCenter15: {
      padding: "6px",
      border: "1px solid #d1d5db",
      textAlign: "center",
    },
    // "p-1.5 border border-gray-300 text-[10px] text-gray-600"
    tdNote: {
      padding: "6px",
      border: "1px solid #d1d5db",
      fontSize: "10px",
      color: "#4b5563",
    },
    // "ml-1 text-[10px] font-medium text-gray-600"
    invoiceTypeBadge: {
      marginLeft: "4px",
      fontSize: "10px",
      fontWeight: "500",
      color: "#4b5563",
    },
    // "text-gray-700 underline"
    locationLink: {
      color: "#374151",
      textDecoration: "underline",
    },

    // ── xs table th / td ─────────────────────────────────────
    // "p-1 border border-gray-300 text-left font-medium"
    thLeft: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "left",
      fontWeight: "500",
    },
    // "p-1 border border-gray-300 text-center font-medium"
    thCenter: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "center",
      fontWeight: "500",
    },
    // "p-1 border border-gray-300 align-top"
    tdAlignTop: {
      padding: "4px",
      border: "1px solid #d1d5db",
      verticalAlign: "top",
    },
    // "p-1 border border-gray-300 text-center"
    tdCenter: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "center",
    },
    // "p-1 border border-gray-300 text-right"
    tdRight: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "right",
    },
    // "p-1 border border-gray-300 align-top text-right font-semibold"
    tdAlignTopRightSemibold: {
      padding: "4px",
      border: "1px solid #d1d5db",
      verticalAlign: "top",
      textAlign: "right",
      fontWeight: "600",
    },
    // "p-1 border border-gray-300 text-right font-medium"
    tdRightMedium: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "right",
      fontWeight: "500",
    },
    // "p-1 border border-gray-300"
    tdPlain: {
      padding: "4px",
      border: "1px solid #d1d5db",
    },
    // "border p-1 font-bold"
    tdBoldPlain: {
      border: "1px solid #d1d5db",
      padding: "4px",
      fontWeight: "700",
    },
    // "border p-1 text-right font-bold"
    tdBoldRight: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      fontWeight: "700",
    },
    // "border p-1 text-left w-2/5"
    thExtrasDesc: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "left",
      width: "40%",
    },
    // "border p-1 text-right w-1/5"
    thExtrasRight: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      width: "20%",
    },
    // "border p-1"
    tdBorderPlain: {
      border: "1px solid #d1d5db",
      padding: "4px",
    },
    // "border p-1 text-right"
    tdBorderRight: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
    },
    // "border p-1 text-right font-medium"
    tdBorderRightMedium: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      fontWeight: "500",
    },

    // ── Room header ──────────────────────────────────────────
    // "flex justify-between items-center mb-1 bg-gray-100 p-1.5"
    roomHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
      backgroundColor: "#f3f4f6",
      padding: "6px",
    },
    // "font-bold text-[11px]"
    roomTitle: {
      fontWeight: "700",
      fontSize: "11px",
    },
    // "text-[10px] text-gray-600 ml-2"
    roomDesc: {
      fontSize: "10px",
      color: "#4b5563",
      marginLeft: "8px",
    },
    // "text-right"
    textRight: { textAlign: "right" },
    // "flex gap-4 text-[10px]"
    roomRates: {
      display: "flex",
      gap: "16px",
      fontSize: "10px",
    },

    // ── Room total row ───────────────────────────────────────
    // "bg-gray-100" applied to <tr>
    roomTotalRow: { backgroundColor: "#f3f4f6" },

    // ── Extras section ───────────────────────────────────────
    // "font-bold text-sm mb-2 border-b pb-1"
    sectionHeading: {
      fontWeight: "700",
      fontSize: "14px",
      marginBottom: "8px",
      borderBottom: "1px solid #d1d5db",
      paddingBottom: "4px",
      marginTop: 0,
    },

    // ── Summary section ──────────────────────────────────────
    // "border p-1 font-medium"
    tdSummaryLabel: {
      border: "1px solid #d1d5db",
      padding: "4px",
      fontWeight: "500",
    },
    // "border p-1 text-right"
    tdSummaryValue: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
    },
    // "border p-1 font-medium text-red-600"
    tdDiscountLabel: {
      border: "1px solid #d1d5db",
      padding: "4px",
      fontWeight: "500",
      color: "#dc2626",
    },
    // "border p-1 text-right font-medium text-red-600"
    tdDiscountValue: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      fontWeight: "500",
      color: "#dc2626",
    },
    // "border p-1 font-medium" on bg-gray-50 row
    tdSubTotalLabel: {
      border: "1px solid #d1d5db",
      padding: "4px",
      fontWeight: "500",
      backgroundColor: "#f9fafb",
    },
    // "border p-1 text-right font-medium" on bg-gray-50 row
    tdSubTotalValue: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      fontWeight: "500",
      backgroundColor: "#f9fafb",
    },
    // "border p-1 font-bold" on bg-gray-100 row
    tdFinalLabel: {
      border: "1px solid #d1d5db",
      padding: "4px",
      fontWeight: "700",
      backgroundColor: "#f3f4f6",
    },
    // "border p-1 text-right font-bold text-base" on bg-gray-100 row
    tdFinalValue: {
      border: "1px solid #d1d5db",
      padding: "4px",
      textAlign: "right",
      fontWeight: "700",
      fontSize: "16px",
      backgroundColor: "#f3f4f6",
    },

    // ── Footer ───────────────────────────────────────────────
    // "mt-6 pt-4 border-t"
    footer: {
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #d1d5db",
    },
    // "grid grid-cols-2 gap-4 text-[10px] text-gray-600"
    footerGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      fontSize: "10px",
      color: "#4b5563",
    },
    // "font-medium mb-1"
    footerLabel: {
      fontWeight: "500",
      marginBottom: "4px",
      margin: "0 0 4px 0",
    },
    // "list-disc list-inside"
    footerList: {
      listStyleType: "disc",
      listStylePosition: "inside",
      margin: 0,
      padding: 0,
    },
    // "mt-4 text-center text-[10px] text-gray-500"
    footerNote: {
      marginTop: "16px",
      textAlign: "center",
      fontSize: "10px",
      color: "#6b7280",
    },

    // Alternating rows
    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: "#f9fafb" },
  };

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <div ref={ref} style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            {/* Logo */}
            <div style={s.logoContainer}>
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                alt="Skanda Industries Logo"
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
                    <div style="width:64px;height:64px;border:1px solid #d1d5db;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:10px;font-weight:700;color:#374151;">SKANDA</span>
                    </div>
                  `;
                }}
              />
            </div>

            <div>
              <h1 style={s.companyName}>SKANDA INDUSTRIES</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Industry:</span> Sy No. 138/A/1 &amp;
                138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar,
                Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span style={s.infoLabel}>Email: </span>
                industry.skanda@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details */}
      <div style={s.mb4}>
        <table style={s.table11}>
          <thead>
            <tr style={s.bgGray100}>
              <th colSpan="4" style={s.thSectionHeader}>
                CLIENT &amp; INVOICE DETAILS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.tdLabel} width="25%">
                Client Name
              </td>
              <td style={s.tdValue} width="25%">
                {client.name || "—"}
                {invoice.invoiceType ? (
                  <span style={s.invoiceTypeBadge}>
                    ({invoice.invoiceType})
                  </span>
                ) : null}
              </td>
              <td style={s.tdLabel} width="25%">
                Proforma Invoice No
              </td>
              <td style={s.tdValueSemibold} width="25%">
                {invoiceIdShort || "—"}
              </td>
            </tr>
            <tr>
              <td style={s.tdLabel}>Mobile</td>
              <td style={s.tdValue}>{client.mobile || "—"}</td>
              <td style={s.tdLabel}>Date</td>
              <td style={s.tdValue}>{invoiceDate || "—"}</td>
            </tr>
            <tr>
              <td style={s.tdLabel}>Email</td>
              <td style={s.tdValue}>{client.email || "—"}</td>
              <td style={s.tdLabel}>Site Address</td>
              <td style={s.tdValue}>{client.siteAddress || "—"}</td>
            </tr>
            {client.siteMapLink && (
              <tr>
                <td style={s.tdLabel}>Location Map</td>
                <td colSpan="3" style={s.tdValue}>
                  <a
                    href={client.siteMapLink}
                    target="_blank"
                    rel="noreferrer"
                    style={s.locationLink}
                  >
                    {client.siteMapLink.length > 60
                      ? client.siteMapLink.substring(0, 60) + "..."
                      : client.siteMapLink}
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pricing Summary */}
      <div style={s.mb4}>
        <table style={s.table11}>
          <thead>
            <tr style={s.bgGray100}>
              <th colSpan="3" style={s.thSectionHeader}>
                PRICING RATES (per sqft)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.tdLabel} width="33%">
                Frame Rate
              </td>
              <td style={s.tdLabel} width="33%">
                Box Rate
              </td>
              <td style={s.tdLabel} width="34%">
                Note
              </td>
            </tr>
            <tr>
              <td style={s.tdCenter15}>
                {frameworkRate ? formatINR(frameworkRate) : "—"}
              </td>
              <td style={s.tdCenter15}>
                {boxRate
                  ? formatINR(boxRate)
                  : frameworkRate
                    ? formatINR(frameworkRate * 1.4)
                    : "—"}
              </td>
              <td style={s.tdNote}>
                Room-specific prices may vary based on requirements.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rooms Breakdown */}
      {rooms.map((room, roomIndex) => {
        const roomFrameRate =
          typeof room.frameRate === "number" && !Number.isNaN(room.frameRate)
            ? room.frameRate
            : frameworkRate || 0;

        const roomBoxRate =
          typeof room.boxRate === "number" && !Number.isNaN(room.boxRate)
            ? room.boxRate
            : boxRate || roomFrameRate * 1.4;

        const roomTotal = calculateRoomTotal(room);

        return (
          <div key={roomIndex} style={s.mb3}>
            {/* Room Header */}
            <div style={s.roomHeader}>
              <div>
                <span style={s.roomTitle}>
                  ROOM: {room.name || `Room ${roomIndex + 1}`}
                </span>
                {room.description && (
                  <span style={s.roomDesc}>({room.description})</span>
                )}
              </div>
              <div style={s.textRight}>
                <div style={s.roomRates}>
                  <span>
                    <span style={s.infoLabel}>Frame Rate:</span>{" "}
                    {formatINR(roomFrameRate)}
                  </span>
                  <span>
                    <span style={s.infoLabel}>Box Rate:</span>{" "}
                    {formatINR(roomBoxRate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {(room.items || []).length > 0 && (
              <table style={s.table10mb1}>
                <thead>
                  <tr style={s.bgGray50}>
                    <th style={s.thLeft} width="20%">
                      Item
                    </th>
                    <th style={s.thCenter} width="12%">
                      Work Type
                    </th>
                    {/* Width, Height, Depth columns intentionally omitted (commented out in original) */}
                    <th style={s.thCenter} width="12%">
                      Area (sqft)
                    </th>
                    <th style={s.thCenter} width="10%">
                      Price
                    </th>
                    <th style={s.thCenter} width="10%">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(room.items || []).map((item, itemIndex) => {
                    const hasFrame = item.frame && item.frame.area > 0;
                    const hasBox = item.box && item.box.area > 0;
                    const itemTotal = calculateItemTotal(item);
                    const rowSpan = hasFrame && hasBox ? 2 : 1;
                    const rowBg = itemIndex % 2 === 0 ? s.rowEven : s.rowOdd;

                    return (
                      <React.Fragment key={itemIndex}>
                        {hasFrame && (
                          <tr style={rowBg}>
                            {rowSpan > 1 ? (
                              <td rowSpan={rowSpan} style={s.tdAlignTop}>
                                <div style={s.infoLabel}>{item.name}</div>
                              </td>
                            ) : (
                              <td style={s.tdAlignTop}>
                                <div style={s.infoLabel}>{item.name}</div>
                              </td>
                            )}
                            <td style={s.tdCenter}>Frame</td>
                            {/* Width, Height, Depth cells intentionally omitted (commented out in original) */}
                            <td style={s.tdCenter}>
                              {item.frame.area.toFixed(2)}
                            </td>
                            <td style={s.tdRight}>
                              {formatINR(item.frame.price)}
                            </td>
                            {rowSpan > 1 ? (
                              <td
                                rowSpan={rowSpan}
                                style={s.tdAlignTopRightSemibold}
                              >
                                {formatINR(itemTotal)}
                              </td>
                            ) : (
                              <td style={s.tdAlignTopRightSemibold}>
                                {formatINR(itemTotal)}
                              </td>
                            )}
                          </tr>
                        )}
                        {hasBox && (
                          <tr style={rowBg}>
                            {!hasFrame && (
                              <td style={s.tdAlignTop}>
                                <div style={s.infoLabel}>{item.name}</div>
                              </td>
                            )}
                            <td style={s.tdCenter}>Box</td>
                            {/* Width, Height, Depth cells intentionally omitted (commented out in original) */}
                            <td style={s.tdCenter}>
                              {item.box.area.toFixed(2)}
                            </td>
                            <td style={s.tdRight}>
                              {formatINR(item.box.price)}
                            </td>
                            {!hasFrame && (
                              <td style={s.tdAlignTopRightSemibold}>
                                {formatINR(itemTotal)}
                              </td>
                            )}
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Accessories Table */}
            {room.accessories?.length > 0 && (
              <table style={s.table10mb1}>
                <thead>
                  <tr style={s.bgGray50}>
                    <th colSpan="4" style={s.thLeft}>
                      ACCESSORIES
                    </th>
                  </tr>
                  <tr style={s.bgGray100}>
                    <th style={s.thLeft} width="50%">
                      Name
                    </th>
                    <th style={s.thCenter} width="17%">
                      Unit Price
                    </th>
                    <th style={s.thCenter} width="16%">
                      Qty
                    </th>
                    <th style={s.thCenter} width="17%">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {room.accessories.map((acc, idx) => {
                    const total = (acc.price || 0) * (acc.qty || 0);
                    return (
                      <tr
                        key={idx}
                        style={idx % 2 === 0 ? s.rowEven : s.rowOdd}
                      >
                        <td style={s.tdPlain}>{acc.name}</td>
                        <td style={s.tdRight}>{formatINR(acc.price)}</td>
                        <td style={s.tdCenter}>{acc.qty}</td>
                        <td style={s.tdRightMedium}>{formatINR(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Room Total */}
            <table style={s.table10border}>
              <tbody>
                <tr style={s.bgGray100}>
                  <td style={s.tdBoldPlain} colSpan="3">
                    Room Total (Items + Accessories)
                  </td>
                  <td style={s.tdBoldRight}>{formatINR(roomTotal || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Extras */}
      {extras.length > 0 && (
        <div style={s.mb4}>
          <h3 style={s.sectionHeading}>Additional Services</h3>
          <table style={s.table10border}>
            <thead>
              <tr style={s.bgGray50}>
                <th style={s.thExtrasDesc}>Description</th>
                <th style={s.thExtrasRight}>Quantity/Area</th>
                <th style={s.thExtrasRight}>Rate</th>
                <th style={s.thExtrasRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((ex) => {
                const inputs = safeInputs(ex.inputs || {});
                const key = ex._id || ex.id || ex.key;

                return (
                  <tr key={key}>
                    <td style={s.tdBorderPlain}>{ex.label}</td>
                    <td style={s.tdBorderRight}>
                      {ex.type === "ceiling"
                        ? inputs.surfaces?.length || 1
                        : ex.type === "area_based"
                          ? `${inputs.area} sq.ft`
                          : "Fixed"}
                    </td>
                    <td style={s.tdBorderRight}>
                      {ex.type === "ceiling"
                        ? "As per design"
                        : ex.type === "area_based"
                          ? formatINR(inputs.unitPrice)
                          : formatINR(inputs.price)}
                    </td>
                    <td style={s.tdBorderRightMedium}>{formatINR(ex.total)}</td>
                  </tr>
                );
              })}
              <tr style={s.bgGray50}>
                <td style={s.tdBoldPlain} colSpan="3">
                  Extras Total
                </td>
                <td style={s.tdBoldRight}>{formatINR(extrasTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div style={s.mb4}>
        <h3 style={s.sectionHeading}>Summary</h3>
        <table style={s.table10border}>
          <tbody>
            <tr>
              <td style={s.tdSummaryLabel}>Total Room Work</td>
              <td style={s.tdSummaryValue}>{formatINR(roomsTotal)}</td>
            </tr>
            {extrasTotal > 0 && (
              <tr>
                <td style={s.tdSummaryLabel}>Additional Services</td>
                <td style={s.tdSummaryValue}>+ {formatINR(extrasTotal)}</td>
              </tr>
            )}
            {/* Sub Total */}
            <tr>
              <td style={s.tdSubTotalLabel}>Sub Total</td>
              <td style={s.tdSubTotalValue}>{formatINR(grandTotal)}</td>
            </tr>
            {/* Discount */}
            {safeDiscount > 0 && (
              <tr>
                <td style={s.tdDiscountLabel}>Discount</td>
                <td style={s.tdDiscountValue}>- {formatINR(safeDiscount)}</td>
              </tr>
            )}
            {/* Final Amount */}
            <tr>
              <td style={s.tdFinalLabel}>FINAL AMOUNT</td>
              <td style={s.tdFinalValue}>{formatINR(finalPayable)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Footer */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <p style={s.footerLabel}>Contact Details:</p>
            <p style={{ margin: 0 }}>
              9700360963 | 9866565057 | 9246893307 | 7799677762
            </p>
            <p style={{ margin: 0 }}>interior.skanda@gmail.com</p>
          </div>
          <div>
            <p style={s.footerLabel}>Terms:</p>
            <ul style={s.footerList}>
              <li>Quotation valid for 30 days</li>
              <li>Final values based on site measurement</li>
              <li>40% advance, 60% on completion</li>
            </ul>
          </div>
        </div>
        <div style={s.footerNote}>
          <p style={{ margin: 0 }}>
            Thank you for considering Skanda Industries. We look forward to
            serving you.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ClientInvoice;
