// src/components/AdminInvoice.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const AdminInvoice = forwardRef(function AdminInvoice({ invoice }, ref) {
  if (!invoice) return null;

  const logoURL = `${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`;

  const client = invoice.client || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const extras = Array.isArray(invoice.extras) ? invoice.extras : [];

  const discount = Number(invoice.discount || 0);
  const finalPayableFromApi = Number(invoice.finalPayable || 0);

  const frameworkRate =
    typeof invoice.pricing?.frameRate === "number"
      ? invoice.pricing.frameRate
      : 0;

  const boxRate =
    typeof invoice.pricing?.boxRate === "number"
      ? invoice.pricing.boxRate
      : frameworkRate * 1.4;

  const useCurrentLocation = !!client.siteMapLink;

  /* ========================================================= */
  /* SAFE HELPERS                                              */
  /* ========================================================= */

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

  const roomsTotal = rooms.reduce(
    (sum, room) => sum + calculateRoomTotal(room),
    0,
  );

  const extrasTotal = extras.reduce(
    (sum, ex) => sum + Number(ex.total || 0),
    0,
  );

  const grandTotal = roomsTotal + extrasTotal;
  const safeDiscount = Math.min(discount, grandTotal);

  const finalPayable =
    finalPayableFromApi > 0 ? finalPayableFromApi : grandTotal - safeDiscount;

  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

  const invoiceIdShort = invoice._id
    ? String(invoice._id).slice(-6).toUpperCase()
    : "";

  /* ========================================================= */
  /* STYLE CONSTANTS                                           */
  /* ========================================================= */

  const s = {
    // Root wrapper
    // "bg-white p-4 text-xs text-black w-full max-w-none min-w-full print-page"
    root: {
      backgroundColor: "#ffffff",
      padding: "16px",
      fontSize: "12px",
      color: "#000000",
      width: "100%",
      maxWidth: "210mm",
      minWidth: "100%",
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    },

    // Header section
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

    // Section block
    // "mb-4"
    sectionBlock: {
      marginBottom: "16px",
    },
    // "mb-3"
    sectionBlockSm: {
      marginBottom: "12px",
    },

    // Shared table styles
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
    },
    tableXs: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "10px",
      marginBottom: "4px",
    },

    // "bg-gray-100"
    theadGray100: {
      backgroundColor: "#f3f4f6",
    },
    // "bg-gray-50"
    theadGray50: {
      backgroundColor: "#f9fafb",
    },

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

    // "p-1 border border-gray-300 text-left font-medium"
    thColLeft: {
      padding: "4px",
      border: "1px solid #d1d5db",
      textAlign: "left",
      fontWeight: "500",
    },
    // "p-1 border border-gray-300 text-center font-medium"
    thColCenter: {
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

    // Pricing table cell
    // "p-1.5 border border-gray-300 text-center"
    tdPricingCenter: {
      padding: "6px",
      border: "1px solid #d1d5db",
      textAlign: "center",
    },
    // "p-1.5 border border-gray-300 text-[10px] text-gray-600"
    tdPricingNote: {
      padding: "6px",
      border: "1px solid #d1d5db",
      fontSize: "10px",
      color: "#4b5563",
    },

    // "text-[10px] text-gray-600 ml-1"
    invoiceTypeBadge: {
      marginLeft: "4px",
      fontSize: "10px",
      fontWeight: "500",
      color: "#4b5563",
    },

    // Location link
    // "text-gray-700 underline"
    locationLink: {
      color: "#374151",
      textDecoration: "underline",
    },

    // Room header
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
    // "flex gap-4 text-[10px]"
    roomRates: {
      display: "flex",
      gap: "16px",
      fontSize: "10px",
    },
    // "text-right"
    roomRatesRight: {
      textAlign: "right",
    },

    // "text-right text-[11px] font-bold mt-1"
    roomTotal: {
      textAlign: "right",
      fontSize: "11px",
      fontWeight: "700",
      marginTop: "4px",
    },

    // Alternating row bg
    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: "#f9fafb" },

    // Extras section
    // "bg-gray-100 p-1.5 mb-1"
    extrasHeader: {
      backgroundColor: "#f3f4f6",
      padding: "6px",
      marginBottom: "4px",
    },
    // "font-bold text-[11px]"
    extrasSectionTitle: {
      fontWeight: "700",
      fontSize: "11px",
    },
    // "mb-2"
    extraItem: {
      marginBottom: "8px",
    },
    // "text-[10px] font-medium mb-0.5"
    extraLabel: {
      fontSize: "10px",
      fontWeight: "500",
      marginBottom: "2px",
    },
    // "text-right text-[10px] font-medium mb-1"
    serviceTotal: {
      textAlign: "right",
      fontSize: "10px",
      fontWeight: "500",
      marginBottom: "4px",
    },
    // "text-right text-[11px] font-bold mt-2 border-t pt-1"
    extrasTotal: {
      textAlign: "right",
      fontSize: "11px",
      fontWeight: "700",
      marginTop: "8px",
      borderTop: "1px solid #d1d5db",
      paddingTop: "4px",
    },

    // Summary section
    // "mt-4"
    summarySection: {
      marginTop: "16px",
    },
    // "flex justify-end"
    summaryFlex: {
      display: "flex",
      justifyContent: "flex-end",
    },
    // "w-64 border-collapse text-[11px]"
    summaryTable: {
      width: "256px",
      borderCollapse: "collapse",
      fontSize: "11px",
    },
    // summary rows
    summaryRowPlain: {
      // "p-1.5 border border-gray-300 font-medium"
      label: { padding: "6px", border: "1px solid #d1d5db", fontWeight: "500" },
      value: {
        padding: "6px",
        border: "1px solid #d1d5db",
        textAlign: "right",
      },
    },
    // "bg-gray-50" row
    summaryRowGray50: {
      label: {
        padding: "6px",
        border: "1px solid #d1d5db",
        fontWeight: "500",
        backgroundColor: "#f9fafb",
      },
      value: {
        padding: "6px",
        border: "1px solid #d1d5db",
        textAlign: "right",
        fontWeight: "500",
        backgroundColor: "#f9fafb",
      },
    },
    // discount row — text-red-600
    summaryRowDiscount: {
      label: {
        padding: "6px",
        border: "1px solid #d1d5db",
        fontWeight: "500",
        color: "#dc2626",
      },
      value: {
        padding: "6px",
        border: "1px solid #d1d5db",
        textAlign: "right",
        fontWeight: "500",
        color: "#dc2626",
      },
    },
    // "bg-gray-100" final row
    summaryRowFinal: {
      label: {
        padding: "6px",
        border: "1px solid #d1d5db",
        fontWeight: "700",
        backgroundColor: "#f3f4f6",
      },
      value: {
        padding: "6px",
        border: "1px solid #d1d5db",
        textAlign: "right",
        fontWeight: "700",
        fontSize: "16px",
        backgroundColor: "#f3f4f6",
      },
    },

    // Footer
    // "mt-6 pt-4 border-t border-gray-300 text-[10px] text-gray-600"
    footer: {
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: "1px solid #d1d5db",
      fontSize: "10px",
      color: "#4b5563",
    },
    // "grid grid-cols-2 gap-4"
    footerGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
    },
    // "font-medium mb-1"
    footerLabel: {
      fontWeight: "500",
      marginBottom: "4px",
    },
    // "list-disc pl-4 space-y-0.5"
    footerList: {
      listStyleType: "disc",
      paddingLeft: "16px",
      margin: 0,
    },
    footerListItem: {
      marginBottom: "2px",
    },
    // "text-right"
    footerRight: {
      textAlign: "right",
    },
    // "mt-2"
    footerMt2: {
      marginTop: "8px",
    },
    // "mt-4 border-t border-gray-300 pt-1"
    footerSignatureBox: {
      marginTop: "16px",
      borderTop: "1px solid #d1d5db",
      paddingTop: "4px",
    },
  };

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <div ref={ref} style={s.root} className="print-page">
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerInner}>
          <div style={s.headerLeft}>
            {/* Logo */}
            <div style={s.logoContainer}>
              <img
                src={logoURL}
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

      {/* Client Details & Invoice Info */}
      <div style={s.sectionBlock}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadGray100}>
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
            {useCurrentLocation && client.siteMapLink && (
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
      <div style={s.sectionBlock}>
        <table style={s.table}>
          <thead>
            <tr style={s.theadGray100}>
              <th colSpan="3" style={s.thSectionHeader}>
                PRICING RATES (per sqft)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.tdLabel} width="33%">
                Global Frame Rate
              </td>
              <td style={s.tdLabel} width="33%">
                Global Box Rate
              </td>
              <td style={s.tdLabel} width="34%">
                Note
              </td>
            </tr>
            <tr>
              <td style={s.tdPricingCenter}>
                {frameworkRate ? formatINR(frameworkRate) : "—"}
              </td>
              <td style={s.tdPricingCenter}>
                {boxRate
                  ? formatINR(boxRate)
                  : frameworkRate
                    ? formatINR(frameworkRate * 1.4)
                    : "—"}
              </td>
              <td style={s.tdPricingNote}>
                Room-specific rates override these when provided
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rooms Section */}
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
          <div key={roomIndex} style={s.sectionBlockSm}>
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
              <div style={s.roomRatesRight}>
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
              <table style={s.tableXs}>
                <thead>
                  <tr style={s.theadGray50}>
                    <th style={s.thColLeft} width="20%">
                      Item
                    </th>
                    <th style={s.thColCenter} width="12%">
                      Work Type
                    </th>
                    <th style={s.thColCenter} width="12%">
                      Width (ft)
                    </th>
                    <th style={s.thColCenter} width="12%">
                      Height (ft)
                    </th>
                    <th style={s.thColCenter} width="12%">
                      Depth (ft)
                    </th>
                    <th style={s.thColCenter} width="12%">
                      Area (sqft)
                    </th>
                    <th style={s.thColCenter} width="10%">
                      Price
                    </th>
                    <th style={s.thColCenter} width="10%">
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
                            <td style={s.tdCenter}>{item.frame.width}</td>
                            <td style={s.tdCenter}>{item.frame.height}</td>
                            <td style={s.tdCenter}>—</td>
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
                            <td style={s.tdCenter}>{item.box.width}</td>
                            <td style={s.tdCenter}>{item.box.height}</td>
                            <td style={s.tdCenter}>{item.box.depth}</td>
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
              <table style={s.tableXs}>
                <thead>
                  <tr style={s.theadGray50}>
                    <th colSpan="4" style={s.thColLeft}>
                      ACCESSORIES
                    </th>
                  </tr>
                  <tr style={s.theadGray100}>
                    <th style={s.thColLeft} width="50%">
                      Name
                    </th>
                    <th style={s.thColCenter} width="17%">
                      Unit Price
                    </th>
                    <th style={s.thColCenter} width="16%">
                      Qty
                    </th>
                    <th style={s.thColCenter} width="17%">
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
            <div style={s.roomTotal}>Room Total: {formatINR(roomTotal)}</div>
          </div>
        );
      })}

      {/* Extras Section */}
      {extras.length > 0 && (
        <div style={s.sectionBlock}>
          <div style={s.extrasHeader}>
            <span style={s.extrasSectionTitle}>ADDITIONAL SERVICES</span>
          </div>

          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs || {});
            const key = ex._id || ex.id || ex.key;

            return (
              <div key={key} style={s.extraItem}>
                <div style={s.extraLabel}>
                  {ex.label} (
                  {ex.type === "ceiling"
                    ? "Ceiling Work"
                    : ex.type === "area_based"
                      ? "Area Based"
                      : "Fixed"}
                  )
                </div>

                {ex.type === "ceiling" && (
                  <div>
                    {/* Surfaces */}
                    {inputs.surfaces.length > 0 && (
                      <table style={s.tableXs}>
                        <thead>
                          <tr style={s.theadGray50}>
                            <th style={s.thColLeft} width="40%">
                              Surface
                            </th>
                            <th style={s.thColCenter} width="20%">
                              Area (sqft)
                            </th>
                            <th style={s.thColCenter} width="20%">
                              Unit Price
                            </th>
                            <th style={s.thColCenter} width="20%">
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {inputs.surfaces.map((surf, i) => (
                            <tr
                              key={i}
                              style={i % 2 === 0 ? s.rowEven : s.rowOdd}
                            >
                              <td style={s.tdPlain}>{surf.label}</td>
                              <td style={s.tdCenter}>{surf.area}</td>
                              <td style={s.tdRight}>
                                {formatINR(surf.unitPrice)}
                              </td>
                              <td style={s.tdRightMedium}>
                                {formatINR(surf.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Electrical Details */}
                    <table style={s.tableXs}>
                      <thead>
                        <tr style={s.theadGray50}>
                          <th style={s.thColCenter} width="25%">
                            Electrical Wiring
                          </th>
                          <th style={s.thColCenter} width="25%">
                            Electrician Charges
                          </th>
                          <th style={s.thColCenter} width="25%">
                            Ceiling Lights
                          </th>
                          <th style={s.thColCenter} width="25%">
                            Profile Lights
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={s.tdCenter}>
                            {formatINR(inputs.electricalWiring)}
                          </td>
                          <td style={s.tdCenter}>
                            {formatINR(inputs.electricianCharges)}
                          </td>
                          <td style={s.tdCenter}>
                            {formatINR(inputs.ceilingLights)}
                          </td>
                          <td style={s.tdCenter}>
                            {formatINR(inputs.profileLights)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Painting Details */}
                    {inputs.ceilingPaintingArea > 0 && (
                      <table style={s.tableXs}>
                        <thead>
                          <tr style={s.theadGray50}>
                            <th style={s.thColCenter} width="34%">
                              Painting Area (sqft)
                            </th>
                            <th style={s.thColCenter} width="33%">
                              Unit Price
                            </th>
                            <th style={s.thColCenter} width="33%">
                              Painting Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={s.tdCenter}>
                              {inputs.ceilingPaintingArea}
                            </td>
                            <td style={s.tdRight}>
                              {formatINR(inputs.ceilingPaintingUnitPrice)}
                            </td>
                            <td style={s.tdRightMedium}>
                              {formatINR(inputs.ceilingPaintingPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {ex.type === "area_based" && (
                  <table style={s.tableXs}>
                    <thead>
                      <tr style={s.theadGray50}>
                        <th style={s.thColCenter} width="34%">
                          Area (sqft)
                        </th>
                        <th style={s.thColCenter} width="33%">
                          Unit Price
                        </th>
                        <th style={s.thColCenter} width="33%">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={s.tdCenter}>{inputs.area}</td>
                        <td style={s.tdRight}>{formatINR(inputs.unitPrice)}</td>
                        <td style={{ ...s.tdRight, fontWeight: "600" }}>
                          {formatINR(ex.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {ex.type === "fixed" && (
                  <table style={s.tableXs}>
                    <thead>
                      <tr style={s.theadGray50}>
                        <th style={s.thColCenter}>Fixed Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ ...s.tdCenter, fontWeight: "600" }}>
                          {formatINR(inputs.price)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <div style={s.serviceTotal}>
                  Service Total: {formatINR(ex.total)}
                </div>
              </div>
            );
          })}

          {extras.length > 0 && (
            <div style={s.extrasTotal}>
              Extras Total: {formatINR(extrasTotal)}
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div style={s.summarySection}>
        <div style={s.summaryFlex}>
          <table style={s.summaryTable}>
            <tbody>
              <tr>
                <td style={s.summaryRowPlain.label}>Rooms Total</td>
                <td style={s.summaryRowPlain.value}>{formatINR(roomsTotal)}</td>
              </tr>
              {extras.length > 0 && (
                <tr>
                  <td style={s.summaryRowPlain.label}>Extras Total</td>
                  <td style={s.summaryRowPlain.value}>
                    {formatINR(extrasTotal)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={s.summaryRowGray50.label}>Sub Total</td>
                <td style={s.summaryRowGray50.value}>
                  {formatINR(grandTotal)}
                </td>
              </tr>
              {safeDiscount > 0 && (
                <tr>
                  <td style={s.summaryRowDiscount.label}>Discount</td>
                  <td style={s.summaryRowDiscount.value}>
                    - {formatINR(safeDiscount)}
                  </td>
                </tr>
              )}
              <tr>
                <td style={s.summaryRowFinal.label}>FINAL AMOUNT</td>
                <td style={s.summaryRowFinal.value}>
                  {formatINR(finalPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Notes */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <p style={s.footerLabel}>Terms &amp; Conditions:</p>
            <ul style={s.footerList}>
              <li style={s.footerListItem}>
                Payment: 50% advance, balance before delivery
              </li>
              <li style={s.footerListItem}>GST included in all prices</li>
              <li style={s.footerListItem}>1 year warranty on workmanship</li>
              <li style={s.footerListItem}>
                Delivery: 30-45 days from advance
              </li>
            </ul>
          </div>
          <div style={s.footerRight}>
            <p style={s.footerLabel}>For Skanda Industries</p>
            <p style={s.footerMt2}>Authorized Signatory</p>
            <div style={s.footerSignatureBox}>
              <p>Computer Generated Invoice - Valid without signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminInvoice;
