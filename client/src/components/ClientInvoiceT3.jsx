// src/components/ClientInvoiceT3.jsx
import React from "react";
import { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoiceT3 = forwardRef(({ invoice, company }, ref) => {
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
    let frameAreaTotal = 0,
      boxAreaTotal = 0,
      framePriceTotal = 0,
      boxPriceTotal = 0;
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
    return {
      frameAreaTotal,
      boxAreaTotal,
      framePriceTotal,
      boxPriceTotal,
      accessoriesTotal,
      itemsTotal,
      roomTotal: itemsTotal + accessoriesTotal,
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
  const invoiceIdShort = invoice._id
    ? `INV-${String(invoice._id).slice(-6).toUpperCase()}`
    : "";

  const logoURL = company?.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
    : null;

  /* ========================================================= */
  /* LIGHT & ELEGANT COLOR PALETTE                             */
  /* ========================================================= */
  const colors = {
    primary: "#4A6B5D", // Soft sage green - replaces dark slate
    secondary: "#7FA392", // Light sage - soft and inviting
    accent: "#D4A853", // Warm gold - keeps premium touch
    accentLight: "#E8D5B0", // Soft champagne
    background: "#FAF9F7", // Warm white
    surface: "#F5F3EF", // Soft greige
    surfaceLight: "#FDFCFA", // Very light surface
    textPrimary: "#3A4A42", // Soft dark green-grey - easier on eyes
    textSecondary: "#7A8A82", // Muted sage-grey
    border: "#E2DDD5", // Warm grey border
    borderLight: "#EFEBE5", // Lighter border for subtle separators
    success: "#5B8A74", // Sage green
    warning: "#C77D4B", // Warm terracotta - kept for discount
    headerBg: "#F0EDE6", // Light warm grey for headers
  };

  /* ========================================================= */
  /* STYLE CONSTANTS                                           */
  /* ========================================================= */

  const s = {
    page: {
      backgroundColor: colors.background,
      padding: "32px",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: colors.textPrimary,
      maxWidth: "800px",
      margin: "0 auto",
      position: "relative",
    },

    borderFrame: {
      position: "absolute",
      top: "16px",
      left: "16px",
      right: "16px",
      bottom: "16px",
      border: `1px solid ${colors.accentLight}`,
      pointerEvents: "none",
    },

    // Header Section
    header: {
      marginBottom: "32px",
      position: "relative",
    },

    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "20px",
    },

    companySection: {
      flex: 1,
    },

    companyName: {
      fontSize: "26px",
      fontWeight: "600",
      color: colors.primary,
      margin: "0 0 8px 0",
      letterSpacing: "-0.02em",
      lineHeight: "1.2",
    },

    companyDetails: {
      fontSize: "11px",
      color: colors.textSecondary,
      lineHeight: "1.6",
      margin: "2px 0",
    },

    logoWrapper: {
      width: "64px",
      height: "64px",
      backgroundColor: colors.surface,
      borderRadius: "8px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: `1px solid ${colors.border}`,
      overflow: "hidden",
      flexShrink: 0,
    },

    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
      padding: "8px",
    },

    logoPlaceholder: {
      width: "64px",
      height: "64px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "24px",
      fontWeight: "600",
      color: colors.primary,
      backgroundColor: colors.surface,
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },

    // Invoice Title Section
    titleSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      borderBottom: `2px solid ${colors.accent}`,
      paddingBottom: "12px",
      marginBottom: "20px",
    },

    invoiceLabel: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      marginBottom: "4px",
    },

    invoiceNumber: {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: "-0.01em",
    },

    invoiceMeta: {
      textAlign: "right",
    },

    metaItem: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "4px",
    },

    metaValue: {
      fontWeight: "600",
      color: colors.primary,
    },

    // Client Information Card
    clientCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      padding: "20px 24px",
      marginBottom: "28px",
      border: `1px solid ${colors.borderLight}`,
    },

    clientHeader: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "14px",
    },

    clientGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "12px 24px",
    },

    clientField: {
      display: "flex",
      alignItems: "baseline",
    },

    clientLabel: {
      fontSize: "11px",
      color: colors.textSecondary,
      width: "85px",
      flexShrink: 0,
    },

    clientValue: {
      fontSize: "12px",
      fontWeight: "500",
      color: colors.textPrimary,
    },

    locationLink: {
      color: colors.primary,
      textDecoration: "none",
      borderBottom: `1px solid ${colors.accent}`,
    },

    // Section Headers
    sectionHeader: {
      fontSize: "15px",
      fontWeight: "600",
      color: colors.primary,
      marginBottom: "16px",
      marginTop: "24px",
      letterSpacing: "-0.01em",
      display: "flex",
      alignItems: "center",
    },

    sectionHeaderAccent: {
      width: "4px",
      height: "18px",
      backgroundColor: colors.accent,
      marginRight: "10px",
      borderRadius: "2px",
    },

    // Separator Line between sections
    sectionSeparator: {
      width: "100%",
      height: "1px",
      backgroundColor: colors.borderLight,
      margin: "24px 0 8px 0",
    },

    // Pricing Card
    pricingCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      padding: "16px 24px",
      marginBottom: "28px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: `1px solid ${colors.borderLight}`,
    },

    pricingItem: {
      display: "flex",
      alignItems: "baseline",
      gap: "12px",
    },

    pricingLabel: {
      fontSize: "11px",
      color: colors.textSecondary,
    },

    pricingValue: {
      fontSize: "18px",
      fontWeight: "600",
      color: colors.primary,
    },

    pricingDivider: {
      width: "1px",
      height: "24px",
      backgroundColor: colors.border,
    },

    pricingNote: {
      fontSize: "10px",
      color: colors.textSecondary,
      fontStyle: "italic",
    },

    // Room Card
    roomCard: {
      marginBottom: "8px",
    },

    roomDivider: {
      width: "100%",
      height: "1px",
      backgroundColor: colors.borderLight,
      margin: "20px 0 24px 0",
    },

    roomHeader: {
      backgroundColor: colors.headerBg,
      padding: "10px 14px",
      borderRadius: "6px",
      marginBottom: "12px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      border: `1px solid ${colors.borderLight}`,
    },

    roomTitle: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
    },

    roomName: {
      fontSize: "15px",
      fontWeight: "600",
      color: colors.primary,
    },

    roomDescription: {
      fontSize: "11px",
      color: colors.textSecondary,
      fontWeight: "400",
    },

    // Tables
    tableContainer: {
      width: "100%",
      overflowX: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
      marginBottom: "8px",
      tableLayout: "fixed",
    },

    tableHeader: {
      backgroundColor: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
    },

    th: {
      padding: "10px 8px",
      textAlign: "left",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    thRight: {
      padding: "10px 8px",
      textAlign: "right",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    td: {
      padding: "8px",
      borderBottom: `1px solid ${colors.borderLight}`,
      color: colors.textPrimary,
      verticalAlign: "top",
    },

    tdRight: {
      padding: "8px",
      borderBottom: `1px solid ${colors.borderLight}`,
      textAlign: "right",
      color: colors.textPrimary,
      fontVariantNumeric: "tabular-nums",
      verticalAlign: "top",
    },

    // Subtotal Row
    subtotalRow: {
      backgroundColor: colors.surface,
    },

    subtotalLabel: {
      padding: "8px",
      fontWeight: "600",
      color: colors.primary,
      fontSize: "11px",
    },

    subtotalValue: {
      padding: "8px",
      textAlign: "right",
      fontWeight: "700",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
      fontSize: "11px",
    },

    // Room Total
    roomTotalSection: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingTop: "6px",
      marginTop: "4px",
    },

    roomTotalLabel: {
      fontSize: "12px",
      fontWeight: "500",
      color: colors.textSecondary,
      marginRight: "20px",
    },

    roomTotalValue: {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
    },

    // Services Separator
    servicesDivider: {
      display: "flex",
      alignItems: "center",
      margin: "28px 0 20px 0",
    },

    servicesDividerLine: {
      flex: 1,
      height: "1px",
      backgroundColor: colors.borderLight,
    },

    servicesDividerText: {
      padding: "0 16px",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
    },

    // Summary Section - With Border
    summarySection: {
      marginTop: "32px",
      paddingTop: "8px",
    },

    summaryCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "12px",
      padding: "24px 28px",
      border: `1px solid ${colors.accentLight}`,
      maxWidth: "380px",
      marginLeft: "auto",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
    },

    summaryTitle: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "16px",
      textAlign: "center",
      borderBottom: `1px solid ${colors.borderLight}`,
      paddingBottom: "12px",
    },

    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      fontSize: "12px",
    },

    summaryLabel: {
      color: colors.textSecondary,
    },

    summaryValue: {
      fontWeight: "500",
      color: colors.textPrimary,
      fontVariantNumeric: "tabular-nums",
    },

    summaryGrayRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "12px",
      borderTop: `1px solid ${colors.borderLight}`,
      borderBottom: `1px solid ${colors.borderLight}`,
      marginTop: "4px",
    },

    discountRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      fontSize: "12px",
      color: colors.warning,
    },

    finalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0 4px",
      marginTop: "12px",
      borderTop: `1px solid ${colors.accent}`,
    },

    finalLabel: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: "0.05em",
    },

    finalValue: {
      fontSize: "26px",
      fontWeight: "700",
      color: colors.accent,
      fontVariantNumeric: "tabular-nums",
    },

    // Footer
    footer: {
      marginTop: "40px",
      paddingTop: "20px",
      borderTop: `1px solid ${colors.borderLight}`,
    },

    footerContent: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },

    footerSection: {
      // No specific styles needed
    },

    footerTitle: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "10px",
    },

    footerText: {
      fontSize: "11px",
      color: colors.textSecondary,
      margin: "3px 0",
    },

    termsList: {
      listStyleType: "none",
      padding: 0,
      margin: 0,
    },

    termItem: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "5px",
      paddingLeft: "16px",
      position: "relative",
    },

    termBullet: {
      position: "absolute",
      left: "0",
      color: colors.accent,
      fontWeight: "600",
    },

    footerNote: {
      textAlign: "center",
      fontSize: "11px",
      color: colors.textSecondary,
      marginTop: "20px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
      fontStyle: "italic",
    },
  };

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <div ref={ref} style={s.page} className="print-page">
      <div style={s.borderFrame} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <div style={s.companySection}>
            <h1 style={s.companyName}>{company?.name || "Company Name"}</h1>
            {company?.registeredOffice && (
              <div style={s.companyDetails}>{company.registeredOffice}</div>
            )}
            {company?.industryAddress && (
              <div style={s.companyDetails}>{company.industryAddress}</div>
            )}
            <div style={s.companyDetails}>
              {company?.phones?.join("  ·  ")} · {company?.email}
            </div>
          </div>

          <div style={s.logoWrapper}>
            {logoURL ? (
              <img
                src={logoURL}
                alt="Logo"
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  const placeholder = document.createElement("div");
                  placeholder.style.cssText = `
                    width: 64px;
                    height: 64px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 600;
                    color: #4A6B5D;
                    background: #F5F3EF;
                    border-radius: 8px;
                  `;
                  placeholder.textContent = (
                    company?.name?.[0] || "C"
                  ).toUpperCase();
                  parent.appendChild(placeholder);
                }}
              />
            ) : (
              <div style={s.logoPlaceholder}>
                {(company?.name?.[0] || "C").toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Title Section */}
        <div style={s.titleSection}>
          <div>
            <div style={s.invoiceLabel}>Estimate / Quotation</div>
            <div style={s.invoiceNumber}>{invoiceIdShort || "—"}</div>
          </div>
          <div style={s.invoiceMeta}>
            <div style={s.metaItem}>
              Date: <span style={s.metaValue}>{invoiceDate || "—"}</span>
            </div>
            {invoice.invoiceType && (
              <div style={s.metaItem}>
                Type: <span style={s.metaValue}>{invoice.invoiceType}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div style={s.clientCard}>
        <div style={s.clientHeader}>Client Information</div>
        <div style={s.clientGrid}>
          <div style={s.clientField}>
            <span style={s.clientLabel}>Name</span>
            <span style={s.clientValue}>{client.name || "—"}</span>
          </div>
          <div style={s.clientField}>
            <span style={s.clientLabel}>Mobile</span>
            <span style={s.clientValue}>{client.mobile || "—"}</span>
          </div>
          <div style={s.clientField}>
            <span style={s.clientLabel}>Email</span>
            <span style={s.clientValue}>{client.email || "—"}</span>
          </div>
          <div style={s.clientField}>
            <span style={s.clientLabel}>Site Address</span>
            <span style={s.clientValue}>{client.siteAddress || "—"}</span>
          </div>
          {client.siteMapLink && (
            <div style={{ ...s.clientField, gridColumn: "1 / -1" }}>
              <span style={s.clientLabel}>Location</span>
              <span style={s.clientValue}>
                <a
                  href={client.siteMapLink}
                  target="_blank"
                  rel="noreferrer"
                  style={s.locationLink}
                >
                  {client.siteMapLink.length > 45
                    ? client.siteMapLink.substring(0, 45) + "..."
                    : client.siteMapLink}
                </a>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      <div style={s.pricingCard}>
        <div style={s.pricingItem}>
          <span style={s.pricingLabel}>Frame Rate</span>
          <span style={s.pricingValue}>
            {frameworkRate ? formatINR(frameworkRate) : "—"}
          </span>
        </div>
        <div style={s.pricingDivider} />
        <div style={s.pricingItem}>
          <span style={s.pricingLabel}>Box Rate</span>
          <span style={s.pricingValue}>
            {boxRate
              ? formatINR(boxRate)
              : frameworkRate
                ? formatINR(frameworkRate * 1.4)
                : "—"}
          </span>
        </div>
        <div style={s.pricingNote}>per square foot</div>
      </div>

      {/* Rooms Section */}
      {rooms.length > 0 && (
        <>
          <div style={s.sectionHeader}>
            <div style={s.sectionHeaderAccent} />
            Roomwise Breakdown
          </div>

          {rooms.map((room, idx) => {
            const agg = roomsTotals[idx] || {};
            const roomFrameRate =
              typeof room.frameRate === "number" &&
              !Number.isNaN(room.frameRate)
                ? room.frameRate
                : frameworkRate || 0;
            const roomBoxRate =
              typeof room.boxRate === "number" && !Number.isNaN(room.boxRate)
                ? room.boxRate
                : boxRate || roomFrameRate * 1.4;
            const isLastRoom = idx === rooms.length - 1;

            return (
              <React.Fragment key={idx}>
                <div style={s.roomCard}>
                  {/* Room Header */}
                  <div style={s.roomHeader}>
                    <div style={s.roomTitle}>
                      <span style={s.roomName}>
                        {room.name || `Room ${idx + 1}`}
                      </span>
                      {room.description && (
                        <span style={s.roomDescription}>
                          — {room.description}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items Table */}
                  <div style={s.tableContainer}>
                    <table style={s.table}>
                      <colgroup>
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "20%" }} />
                      </colgroup>
                      <thead>
                        <tr style={s.tableHeader}>
                          <th style={s.th}>Description</th>
                          <th style={s.thRight}>Area (sqft)</th>
                          <th style={s.thRight}>Rate</th>
                          <th style={s.thRight}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={s.td}>Frame Work</td>
                          <td style={s.tdRight}>
                            {agg.frameAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>{formatINR(roomFrameRate)}</td>
                          <td style={s.tdRight}>
                            {formatINR(agg.framePriceTotal || 0)}
                          </td>
                        </tr>
                        <tr>
                          <td style={s.td}>Box Work</td>
                          <td style={s.tdRight}>
                            {agg.boxAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>{formatINR(roomBoxRate)}</td>
                          <td style={s.tdRight}>
                            {formatINR(agg.boxPriceTotal || 0)}
                          </td>
                        </tr>
                        <tr style={s.subtotalRow}>
                          <td style={s.subtotalLabel} colSpan="3">
                            Room Items Subtotal
                          </td>
                          <td style={s.subtotalValue}>
                            {formatINR(agg.itemsTotal || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Accessories Table */}
                  {agg.accessories?.length > 0 && (
                    <div style={s.tableContainer}>
                      <table style={s.table}>
                        <colgroup>
                          <col style={{ width: "40%" }} />
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "20%" }} />
                          <col style={{ width: "20%" }} />
                        </colgroup>
                        <thead>
                          <tr style={s.tableHeader}>
                            <th style={s.th}>Accessory</th>
                            <th style={s.thRight}>Qty</th>
                            <th style={s.thRight}>Rate</th>
                            <th style={s.thRight}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {agg.accessories.map((acc, i) => (
                            <tr key={i}>
                              <td style={s.td}>{acc.name || "Accessory"}</td>
                              <td style={s.tdRight}>{acc.qty || 1}</td>
                              <td style={s.tdRight}>
                                {formatINR(acc.price || 0)}
                              </td>
                              <td style={s.tdRight}>
                                {formatINR((acc.price || 0) * (acc.qty || 1))}
                              </td>
                            </tr>
                          ))}
                          <tr style={s.subtotalRow}>
                            <td style={s.subtotalLabel} colSpan="3">
                              Accessories Total
                            </td>
                            <td style={s.subtotalValue}>
                              {formatINR(agg.accessoriesTotal || 0)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Room Total */}
                  <div style={s.roomTotalSection}>
                    <span style={s.roomTotalLabel}>Room Total</span>
                    <span style={s.roomTotalValue}>
                      {formatINR(agg.roomTotal || 0)}
                    </span>
                  </div>
                </div>

                {/* Room Divider */}
                {!isLastRoom && <div style={s.roomDivider} />}
              </React.Fragment>
            );
          })}
        </>
      )}

      {/* Services Separator */}
      {extras.length > 0 && (
        <div style={s.servicesDivider}>
          <div style={s.servicesDividerLine} />
          <span style={s.servicesDividerText}>Additional Services</span>
          <div style={s.servicesDividerLine} />
        </div>
      )}

      {/* Extras Section */}
      {extras.length > 0 && (
        <div style={s.tableContainer}>
          <table style={s.table}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr style={s.tableHeader}>
                <th style={s.th}>Description</th>
                <th style={s.thRight}>Qty / Area</th>
                <th style={s.thRight}>Rate</th>
                <th style={s.thRight}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((ex, i) => {
                const inputs = safeInputs(ex.inputs || {});
                return (
                  <tr key={ex._id || i}>
                    <td style={s.td}>{ex.label}</td>
                    <td style={s.tdRight}>
                      {ex.type === "ceiling"
                        ? inputs.surfaces?.length || 1
                        : ex.type === "area_based"
                          ? `${inputs.area} sqft`
                          : "Fixed"}
                    </td>
                    <td style={s.tdRight}>
                      {ex.type === "ceiling"
                        ? "As per design"
                        : ex.type === "area_based"
                          ? formatINR(inputs.unitPrice)
                          : formatINR(inputs.price)}
                    </td>
                    <td style={s.tdRight}>{formatINR(ex.total)}</td>
                  </tr>
                );
              })}
              <tr style={s.subtotalRow}>
                <td style={s.subtotalLabel} colSpan="3">
                  Extras Total
                </td>
                <td style={s.subtotalValue}>{formatINR(extrasTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Section - With Border Card */}
      <div style={s.summarySection}>
        <div style={s.summaryCard}>
          <div style={s.summaryTitle}>Payment Summary</div>

          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Total Room Work</span>
            <span style={s.summaryValue}>{formatINR(roomsTotal)}</span>
          </div>

          {extrasTotal > 0 && (
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Additional Services</span>
              <span style={s.summaryValue}>{formatINR(extrasTotal)}</span>
            </div>
          )}

          <div style={s.summaryGrayRow}>
            <span style={s.summaryLabel}>Sub Total</span>
            <span style={s.summaryValue}>{formatINR(grandTotal)}</span>
          </div>

          {safeDiscount > 0 && (
            <div style={s.discountRow}>
              <span>Discount</span>
              <span>− {formatINR(safeDiscount)}</span>
            </div>
          )}

          <div style={s.finalRow}>
            <span style={s.finalLabel}>FINAL AMOUNT</span>
            <span style={s.finalValue}>{formatINR(finalPayable)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerContent}>
          <div style={s.footerSection}>
            <div style={s.footerTitle}>Contact Details</div>
            <p style={s.footerText}>{company?.phones?.join(" · ")}</p>
            <p style={s.footerText}>{company?.email}</p>
            {company?.website && <p style={s.footerText}>{company.website}</p>}
          </div>

          <div style={s.footerSection}>
            <div style={s.footerTitle}>Terms & Conditions</div>
            {(company?.termsAndConditions ?? []).length > 0 ? (
              <ul style={s.termsList}>
                {company.termsAndConditions.map((t, i) => (
                  <li key={i} style={s.termItem}>
                    <span style={s.termBullet}>•</span>
                    {t}
                  </li>
                ))}
              </ul>
            ) : (
              <ul style={s.termsList}>
                <li style={s.termItem}>
                  <span style={s.termBullet}>•</span>
                  Quotation valid for 30 days
                </li>
                <li style={s.termItem}>
                  <span style={s.termBullet}>•</span>
                  Final values based on site measurement
                </li>
                <li style={s.termItem}>
                  <span style={s.termBullet}>•</span>
                  40% advance, 60% on completion
                </li>
              </ul>
            )}
          </div>
        </div>

        <div style={s.footerNote}>
          Thank you for considering {company?.name}. We look forward to serving
          you.
        </div>
      </div>
    </div>
  );
});

export default ClientInvoiceT3;
