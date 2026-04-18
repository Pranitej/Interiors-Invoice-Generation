// src/components/AdminInvoiceT3.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";
const AdminInvoiceT3 = forwardRef(function AdminInvoiceT3({ invoice, company }, ref) {
  if (!invoice) return null;

  const logoURL = company?.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
    : null;

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
    root: { backgroundColor: "#ffffff", padding: "16px", fontSize: "12px", color: "#000000", width: "100%", maxWidth: "210mm", minWidth: "100%", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },

    header: { borderBottom: "2px solid #0d9488", paddingBottom: "12px", marginBottom: "16px" },
    headerInner: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
    headerLeft: { display: "flex", alignItems: "flex-start", gap: "0" },
    accentBar: { width: "4px", backgroundColor: "#0d9488", alignSelf: "stretch", marginRight: "12px", borderRadius: "2px", minHeight: "64px" },
    logoContainer: { width: "64px", height: "64px", flexShrink: 0, marginTop: "4px", marginRight: "12px" },
    logoImg: { width: "100%", height: "100%", objectFit: "contain" },
    companyName: { fontSize: "24px", fontWeight: "700", letterSpacing: "-0.025em", margin: 0, color: "#0d9488" },
    companyAddressLine: { fontSize: "10px", color: "#4b5563", lineHeight: "1.25", marginTop: "4px", marginBottom: 0 },
    companyInfoLine: { fontSize: "10px", color: "#4b5563", margin: 0 },
    infoLabel: { fontWeight: "500", color: "#0f766e" },

    sectionBlock: { marginBottom: "16px" },
    sectionBlockSm: { marginBottom: "12px" },

    table: { width: "100%", borderCollapse: "collapse", fontSize: "11px" },
    tableXs: { width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "4px" },

    theadGray100: { backgroundColor: "#0d9488" },
    theadGray50: { backgroundColor: "#f0fdfa" },

    thSectionHeader: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #0f766e", color: "#ffffff" },
    tdLabel: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
    tdValue: { padding: "6px", border: "1px solid #ccfbf1" },
    tdValueSemibold: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "600" },

    thColLeft: { padding: "4px", border: "1px solid #0f766e", textAlign: "left", fontWeight: "500", color: "#ffffff" },
    thColCenter: { padding: "4px", border: "1px solid #0f766e", textAlign: "center", fontWeight: "500", color: "#ffffff" },

    tdAlignTop: { padding: "4px", border: "1px solid #ccfbf1", verticalAlign: "top" },
    tdCenter: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "center" },
    tdRight: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "right" },
    tdAlignTopRightSemibold: { padding: "4px", border: "1px solid #ccfbf1", verticalAlign: "top", textAlign: "right", fontWeight: "600" },
    tdRightMedium: { padding: "4px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500" },
    tdPlain: { padding: "4px", border: "1px solid #ccfbf1" },
    tdPricingCenter: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "center" },
    tdPricingNote: { padding: "6px", border: "1px solid #ccfbf1", fontSize: "10px", color: "#4b5563" },

    invoiceTypeBadge: { marginLeft: "4px", fontSize: "10px", fontWeight: "500", color: "#4b5563" },
    locationLink: { color: "#0d9488", textDecoration: "underline" },

    roomHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", backgroundColor: "#0d9488", padding: "6px" },
    roomTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
    roomDesc: { fontSize: "10px", color: "#ccfbf1", marginLeft: "8px" },
    roomRates: { display: "flex", gap: "16px", fontSize: "10px", color: "#ffffff" },
    roomRatesRight: { textAlign: "right" },
    roomTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "4px" },
    roomTotalChip: { display: "inline-block", backgroundColor: "#0d9488", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" },

    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: "#f0fdfa" },

    extrasHeader: { backgroundColor: "#0d9488", padding: "6px", marginBottom: "4px" },
    extrasSectionTitle: { fontWeight: "700", fontSize: "11px", color: "#ffffff" },
    extraItem: { marginBottom: "8px" },
    extraLabel: { fontSize: "10px", fontWeight: "500", marginBottom: "2px" },
    serviceTotal: { textAlign: "right", fontSize: "10px", fontWeight: "500", marginBottom: "4px" },
    extrasTotal: { textAlign: "right", fontSize: "11px", fontWeight: "700", marginTop: "8px", borderTop: "1px solid #99f6e4", paddingTop: "4px" },

    summarySection: { marginTop: "16px" },
    summaryFlex: { display: "flex", justifyContent: "flex-end" },
    summaryTable: { width: "256px", borderCollapse: "collapse", fontSize: "11px" },
    summaryRowPlain: {
      label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500" },
      value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right" },
    },
    summaryRowGray50: {
      label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", backgroundColor: "#f0fdfa" },
      value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500", backgroundColor: "#f0fdfa" },
    },
    summaryRowDiscount: {
      label: { padding: "6px", border: "1px solid #ccfbf1", fontWeight: "500", color: "#dc2626" },
      value: { padding: "6px", border: "1px solid #ccfbf1", textAlign: "right", fontWeight: "500", color: "#dc2626" },
    },
    summaryRowFinal: {
      label: { padding: "6px", border: "1px solid #0d9488", fontWeight: "700", backgroundColor: "#0d9488", color: "#ffffff" },
      value: { padding: "6px", border: "1px solid #0d9488", textAlign: "right", fontWeight: "700", fontSize: "16px", backgroundColor: "#0d9488", color: "#ffffff" },
    },

    footer: { marginTop: "24px", paddingTop: "16px", borderTop: "2px solid #0d9488", fontSize: "10px", color: "#4b5563" },
    footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    footerLabel: { fontWeight: "500", marginBottom: "4px", color: "#0d9488" },
    footerList: { listStyleType: "disc", paddingLeft: "16px", margin: 0 },
    footerListItem: { marginBottom: "2px" },
    footerRight: { textAlign: "right" },
    footerMt2: { marginTop: "8px" },
    footerSignatureBox: { marginTop: "16px", borderTop: "1px solid #99f6e4", paddingTop: "4px" },
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
            <div style={s.accentBar} />
            <div style={s.logoContainer}>
              <img
                src={logoURL}
                alt={`${company?.name} Logo`}
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `<div style="width:64px;height:64px;border:1px solid #99f6e4;background:#f0fdfa;display:flex;align-items:center;justify-content:center;border-radius:6px;"><svg xmlns='http://www.w3.org/2000/svg' width='36' height='36' viewBox='0 0 24 24' fill='none' stroke='#0d9488' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'/><polyline points='9 22 9 12 15 12 15 22'/></svg></div>`;
                }}
              />
            </div>
            <div>
              <h1 style={s.companyName}>{company?.name}</h1>
              <p style={s.companyAddressLine}>
                <span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}
              </p>
              {company?.industryAddress && (
                <p style={s.companyInfoLine}>
                  <span style={s.infoLabel}>Industry:</span> {company.industryAddress}
                </p>
              )}
              <p style={s.companyInfoLine}>
                <span style={s.infoLabel}>Contact: </span>
                {company?.phones.join(", ")} |{" "}
                <span style={s.infoLabel}>Email: </span>
                {company?.email}
              </p>
              {company?.website && (
                <p style={s.companyInfoLine}>
                  <span style={s.infoLabel}>Website: </span>
                  {company.website}
                </p>
              )}
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
            <div style={s.roomTotal}>
              Room Total: <span style={s.roomTotalChip}>{formatINR(roomTotal)}</span>
            </div>
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
            {(company?.termsAndConditions ?? []).length > 0 && (
              <>
                <p style={s.footerLabel}>Terms &amp; Conditions:</p>
                <ul style={s.footerList}>
                  {company.termsAndConditions.map((term, i) => (
                    <li key={i} style={s.footerListItem}>{term}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <div style={s.footerRight}>
            <p style={s.footerLabel}>For {company?.name}</p>
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

export default AdminInvoiceT3;
