// src/components/AdminInvoiceT3.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const AdminInvoiceT3 = forwardRef(function AdminInvoiceT3(
  { invoice, company },
  ref,
) {
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
    ? new Date(invoice.createdAt)
        .toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .toUpperCase()
    : "";

  const invoiceIdShort = invoice._id
    ? String(invoice._id).slice(-6).toUpperCase()
    : "";

  /* ========================================================= */
  /* REFINED COLOR PALETTE                                     */
  /* ========================================================= */
  const colors = {
    primary: "#1A2E3D",
    secondary: "#2C4C5E",
    accent: "#D4A853",
    accentLight: "#E8D5B0",
    background: "#FAF9F7",
    surface: "#F5F3EF",
    textPrimary: "#2C3E4F",
    textSecondary: "#6B7B8C",
    border: "#E2DDD5",
    success: "#2D6A4F",
    warning: "#C77D4B",
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
      maxWidth: "210mm",
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
      marginBottom: "40px",
      position: "relative",
    },

    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "24px",
    },

    companySection: {
      flex: 1,
    },

    companyName: {
      fontSize: "28px",
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
      width: "70px",
      height: "70px",
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
      width: "70px",
      height: "70px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      fontWeight: "600",
      color: colors.primary,
      backgroundColor: colors.surface,
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },

    // Invoice Title Badge
    titleSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      borderBottom: `2px solid ${colors.primary}`,
      paddingBottom: "16px",
      marginBottom: "24px",
    },

    invoiceLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.15em",
      textTransform: "uppercase",
      marginBottom: "4px",
    },

    invoiceNumber: {
      fontSize: "18px",
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: "-0.01em",
    },

    invoiceMeta: {
      textAlign: "right",
    },

    metaItem: {
      fontSize: "12px",
      color: colors.textSecondary,
      marginBottom: "4px",
    },

    metaValue: {
      fontWeight: "600",
      color: colors.primary,
    },

    // Client Information Card
    clientCard: {
      backgroundColor: colors.surface,
      borderRadius: "12px",
      padding: "24px 28px",
      marginBottom: "32px",
      border: `1px solid ${colors.border}`,
    },

    clientHeader: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "16px",
    },

    clientGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(2, 1fr)",
      gap: "16px 32px",
    },

    clientField: {
      display: "flex",
      alignItems: "baseline",
    },

    clientLabel: {
      fontSize: "12px",
      color: colors.textSecondary,
      width: "90px",
      flexShrink: 0,
    },

    clientValue: {
      fontSize: "13px",
      fontWeight: "500",
      color: colors.textPrimary,
    },

    locationLink: {
      color: colors.secondary,
      textDecoration: "none",
      borderBottom: `1px solid ${colors.accent}`,
    },

    // Section Headers
    sectionHeader: {
      fontSize: "16px",
      fontWeight: "600",
      color: colors.primary,
      marginBottom: "20px",
      letterSpacing: "-0.01em",
      display: "flex",
      alignItems: "center",
    },

    sectionHeaderAccent: {
      width: "4px",
      height: "20px",
      backgroundColor: colors.accent,
      marginRight: "12px",
      borderRadius: "2px",
    },

    // Pricing Card
    pricingCard: {
      backgroundColor: colors.surface,
      borderRadius: "10px",
      padding: "20px 28px",
      marginBottom: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      border: `1px solid ${colors.border}`,
    },

    pricingItem: {
      display: "flex",
      alignItems: "baseline",
      gap: "16px",
    },

    pricingLabel: {
      fontSize: "12px",
      color: colors.textSecondary,
    },

    pricingValue: {
      fontSize: "20px",
      fontWeight: "600",
      color: colors.primary,
    },

    pricingDivider: {
      width: "1px",
      height: "30px",
      backgroundColor: colors.border,
    },

    pricingNote: {
      fontSize: "11px",
      color: colors.textSecondary,
      fontStyle: "italic",
    },

    // Room Divider Line
    roomDivider: {
      width: "100%",
      height: "1px",
      backgroundColor: colors.border,
      margin: "24px 0 28px 0",
    },

    // Room Card
    roomCard: {
      marginBottom: "8px",
    },

    roomHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },

    roomTitle: {
      display: "flex",
      alignItems: "center",
      gap: "12px",
    },

    roomName: {
      fontSize: "18px",
      fontWeight: "600",
      color: colors.primary,
    },

    roomDescription: {
      fontSize: "12px",
      color: colors.textSecondary,
      fontWeight: "400",
    },

    roomRates: {
      display: "flex",
      gap: "24px",
    },

    rateItem: {
      fontSize: "12px",
    },

    rateLabel: {
      color: colors.textSecondary,
      marginRight: "8px",
    },

    rateValue: {
      fontWeight: "600",
      color: colors.primary,
    },

    // Tables - Fixed Column Widths
    tableContainer: {
      width: "100%",
      overflowX: "auto",
    },

    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "12px",
      marginBottom: "12px",
      tableLayout: "fixed",
    },

    tableHeader: {
      backgroundColor: colors.surface,
      borderBottom: `2px solid ${colors.border}`,
    },

    th: {
      padding: "12px 8px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    thCenter: {
      padding: "12px 8px",
      textAlign: "center",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    thRight: {
      padding: "12px 8px",
      textAlign: "right",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
    },

    td: {
      padding: "10px 8px",
      borderBottom: `1px solid ${colors.border}`,
      color: colors.textPrimary,
      verticalAlign: "top",
    },

    tdCenter: {
      padding: "10px 8px",
      borderBottom: `1px solid ${colors.border}`,
      textAlign: "center",
      color: colors.textPrimary,
      verticalAlign: "top",
    },

    tdRight: {
      padding: "10px 8px",
      borderBottom: `1px solid ${colors.border}`,
      textAlign: "right",
      color: colors.textPrimary,
      fontVariantNumeric: "tabular-nums",
      verticalAlign: "top",
    },

    // Room Total
    roomTotalSection: {
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      paddingTop: "8px",
      marginTop: "8px",
    },

    roomTotalLabel: {
      fontSize: "13px",
      fontWeight: "500",
      color: colors.textSecondary,
      marginRight: "24px",
    },

    roomTotalValue: {
      fontSize: "18px",
      fontWeight: "700",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
    },

    // Grand Total Section
    grandTotalSection: {
      marginTop: "32px",
      paddingTop: "24px",
      borderTop: `2px solid ${colors.border}`,
    },

    summaryWrapper: {
      maxWidth: "400px",
      marginLeft: "auto",
    },

    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "13px",
    },

    summaryLabel: {
      color: colors.textSecondary,
    },

    summaryValue: {
      fontWeight: "600",
      color: colors.textPrimary,
      fontVariantNumeric: "tabular-nums",
    },

    discountRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      fontSize: "13px",
      color: colors.warning,
    },

    finalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "16px 0 8px",
      marginTop: "8px",
      borderTop: `1px solid ${colors.border}`,
    },

    finalLabel: {
      fontSize: "15px",
      fontWeight: "600",
      color: colors.primary,
      letterSpacing: "0.05em",
    },

    finalValue: {
      fontSize: "28px",
      fontWeight: "700",
      color: colors.secondary,
      fontVariantNumeric: "tabular-nums",
    },

    // Extras Section - Compact
    extrasSection: {
      marginTop: "32px",
    },

    extrasGrid: {
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },

    extraCard: {
      backgroundColor: colors.surface,
      borderRadius: "10px",
      padding: "16px 20px",
      border: `1px solid ${colors.border}`,
    },

    extraHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      paddingBottom: "12px",
      borderBottom: `1px solid ${colors.border}`,
    },

    extraTitleSection: {
      display: "flex",
      alignItems: "baseline",
      gap: "12px",
    },

    extraTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.primary,
    },

    extraSubtitle: {
      fontSize: "11px",
      color: colors.textSecondary,
    },

    extraTotalCompact: {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
    },

    // Compact tables for extras - Fixed alignment
    compactTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
      marginBottom: "12px",
      tableLayout: "fixed",
    },

    compactTableHeader: {
      borderBottom: `1px solid ${colors.border}`,
    },

    compactTh: {
      padding: "8px 8px",
      textAlign: "left",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },

    compactThCenter: {
      padding: "8px 8px",
      textAlign: "center",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },

    compactThRight: {
      padding: "8px 8px",
      textAlign: "right",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },

    compactTd: {
      padding: "8px 8px",
      borderBottom: `1px solid ${colors.border}`,
      fontSize: "11px",
      verticalAlign: "top",
    },

    compactTdCenter: {
      padding: "8px 8px",
      borderBottom: `1px solid ${colors.border}`,
      textAlign: "center",
      fontSize: "11px",
      verticalAlign: "top",
    },

    compactTdRight: {
      padding: "8px 8px",
      borderBottom: `1px solid ${colors.border}`,
      textAlign: "right",
      fontSize: "11px",
      fontVariantNumeric: "tabular-nums",
      verticalAlign: "top",
    },

    // Electrical row display
    electricalRow: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "12px",
      marginBottom: "12px",
    },

    electricalItem: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      backgroundColor: colors.background,
      borderRadius: "6px",
    },

    electricalLabel: {
      fontSize: "10px",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },

    electricalValue: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
    },

    // Fixed price display
    fixedPriceDisplay: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 16px",
      backgroundColor: colors.background,
      borderRadius: "8px",
      marginTop: "8px",
    },

    fixedPriceLabel: {
      fontSize: "12px",
      color: colors.textSecondary,
    },

    fixedPriceValue: {
      fontSize: "18px",
      fontWeight: "700",
      color: colors.primary,
      fontVariantNumeric: "tabular-nums",
    },

    // Footer
    footer: {
      marginTop: "48px",
      paddingTop: "24px",
      borderTop: `1px solid ${colors.border}`,
    },

    footerContent: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },

    termsSection: {
      flex: 1,
    },

    termsTitle: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      marginBottom: "12px",
    },

    termItem: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "6px",
      paddingLeft: "20px",
      position: "relative",
    },

    termBullet: {
      position: "absolute",
      left: "0",
      color: colors.accent,
      fontWeight: "600",
    },

    signatureSection: {
      textAlign: "right",
      minWidth: "200px",
    },

    signatureLabel: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "24px",
    },

    signatureLine: {
      width: "160px",
      height: "1px",
      backgroundColor: colors.border,
      marginBottom: "8px",
      marginLeft: "auto",
    },

    signatureNote: {
      fontSize: "10px",
      color: colors.textSecondary,
      fontStyle: "italic",
      marginTop: "16px",
    },

    footerNote: {
      textAlign: "center",
      fontSize: "10px",
      color: colors.textSecondary,
      marginTop: "24px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.border}`,
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
            {company?.website && (
              <div style={s.companyDetails}>{company.website}</div>
            )}
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
                    width: 70px;
                    height: 70px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: 600;
                    color: #1A2E3D;
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
            <div style={s.invoiceLabel}>Invoice</div>
            <div style={s.invoiceNumber}>#{invoiceIdShort}</div>
          </div>
          <div style={s.invoiceMeta}>
            <div style={s.metaItem}>
              Date: <span style={s.metaValue}>{invoiceDate}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div style={s.clientCard}>
        <div style={s.clientHeader}>Client Information</div>
        <div style={s.clientGrid}>
          <div style={s.clientField}>
            <span style={s.clientLabel}>Name</span>
            <span style={s.clientValue}>
              {client.name || "—"}
              {invoice.invoiceType && (
                <span
                  style={{ marginLeft: "8px", color: colors.textSecondary }}
                >
                  ({invoice.invoiceType})
                </span>
              )}
            </span>
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
          {useCurrentLocation && client.siteMapLink && (
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

      {/* Rooms Section with Dividers */}
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
        // const isLastRoom = roomIndex === rooms.length - 1;

        return (
          <React.Fragment key={roomIndex}>
            <div style={s.roomCard}>
              {/* Room Header */}
              <div style={s.roomHeader}>
                <div style={s.roomTitle}>
                  <div style={s.sectionHeaderAccent} />
                  <span style={s.roomName}>
                    {room.name || `Room ${roomIndex + 1}`}
                  </span>
                  {room.description && (
                    <span style={s.roomDescription}>— {room.description}</span>
                  )}
                </div>
                <div style={s.roomRates}>
                  <span style={s.rateItem}>
                    <span style={s.rateLabel}>Frame</span>
                    <span style={s.rateValue}>{formatINR(roomFrameRate)}</span>
                  </span>
                  <span style={s.rateItem}>
                    <span style={s.rateLabel}>Box</span>
                    <span style={s.rateValue}>{formatINR(roomBoxRate)}</span>
                  </span>
                </div>
              </div>

              {/* Items Table */}
              {(room.items || []).length > 0 && (
                <div style={s.tableContainer}>
                  <table style={s.table}>
                    <colgroup>
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "14%" }} />
                    </colgroup>
                    <thead>
                      <tr style={s.tableHeader}>
                        <th style={s.th}>Item</th>
                        <th style={s.thCenter}>Type</th>
                        <th style={s.thCenter}>W</th>
                        <th style={s.thCenter}>H</th>
                        <th style={s.thCenter}>D</th>
                        <th style={s.thCenter}>Area</th>
                        <th style={s.thRight}>Unit Price</th>
                        <th style={s.thRight}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(room.items || []).map((item, itemIndex) => {
                        const hasFrame = item.frame && item.frame.area > 0;
                        const hasBox = item.box && item.box.area > 0;
                        const itemTotal = calculateItemTotal(item);
                        const rowSpan = hasFrame && hasBox ? 2 : 1;

                        return (
                          <React.Fragment key={itemIndex}>
                            {hasFrame && (
                              <tr>
                                {rowSpan > 1 ? (
                                  <td
                                    rowSpan={rowSpan}
                                    style={{
                                      ...s.td,
                                      verticalAlign: "middle",
                                      fontWeight: "500",
                                    }}
                                  >
                                    {item.name}
                                  </td>
                                ) : (
                                  <td style={{ ...s.td, fontWeight: "500" }}>
                                    {item.name}
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
                                    style={{
                                      ...s.tdRight,
                                      verticalAlign: "middle",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {formatINR(itemTotal)}
                                  </td>
                                ) : (
                                  <td
                                    style={{ ...s.tdRight, fontWeight: "600" }}
                                  >
                                    {formatINR(itemTotal)}
                                  </td>
                                )}
                              </tr>
                            )}
                            {hasBox && (
                              <tr>
                                {!hasFrame && (
                                  <td style={{ ...s.td, fontWeight: "500" }}>
                                    {item.name}
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
                                  <td
                                    style={{ ...s.tdRight, fontWeight: "600" }}
                                  >
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
                </div>
              )}

              {/* Accessories */}
              {room.accessories?.length > 0 && (
                <div style={s.tableContainer}>
                  <table style={{ ...s.table, marginTop: "16px" }}>
                    <colgroup>
                      <col style={{ width: "50%" }} />
                      <col style={{ width: "18%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "18%" }} />
                    </colgroup>
                    <thead>
                      <tr style={s.tableHeader}>
                        <th style={s.th}>Accessories</th>
                        <th style={s.thRight}>Unit Price</th>
                        <th style={s.thCenter}>Quantity</th>
                        <th style={s.thRight}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.accessories.map((acc, idx) => {
                        const total = (acc.price || 0) * (acc.qty || 0);
                        return (
                          <tr key={idx}>
                            <td style={s.td}>{acc.name}</td>
                            <td style={s.tdRight}>{formatINR(acc.price)}</td>
                            <td style={s.tdCenter}>{acc.qty}</td>
                            <td style={{ ...s.tdRight, fontWeight: "500" }}>
                              {formatINR(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Room Total */}
              <div style={s.roomTotalSection}>
                <span style={s.roomTotalLabel}>Room Total</span>
                <span style={s.roomTotalValue}>{formatINR(roomTotal)}</span>
              </div>
            </div>

            {/* Room Divider - Show between rooms, not after the last one */}
            <div style={s.roomDivider} />
          </React.Fragment>
        );
      })}

      {/* Extras Section */}
      {extras.length > 0 && (
        <div style={s.extrasSection}>
          <div style={s.sectionHeader}>
            <div style={s.sectionHeaderAccent} />
            Additional Services
          </div>

          <div style={s.extrasGrid}>
            {extras.map((ex) => {
              const inputs = safeInputs(ex.inputs || {});
              const key = ex._id || ex.id || ex.key;

              return (
                <div key={key} style={s.extraCard}>
                  <div style={s.extraHeader}>
                    <div style={s.extraTitleSection}>
                      <span style={s.extraTitle}>{ex.label}</span>
                      <span style={s.extraSubtitle}>
                        {ex.type === "ceiling"
                          ? "Ceiling Work"
                          : ex.type === "area_based"
                            ? "Area Based"
                            : "Fixed Price"}
                      </span>
                    </div>
                    <span style={s.extraTotalCompact}>
                      {formatINR(ex.total)}
                    </span>
                  </div>

                  {ex.type === "ceiling" && (
                    <>
                      {/* Surfaces Table */}
                      {inputs.surfaces.length > 0 && (
                        <table style={s.compactTable}>
                          <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "20%" }} />
                            <col style={{ width: "20%" }} />
                          </colgroup>
                          <thead>
                            <tr style={s.compactTableHeader}>
                              <th style={s.compactTh}>Surface</th>
                              <th style={s.compactThCenter}>Area (sqft)</th>
                              <th style={s.compactThRight}>Unit Price</th>
                              <th style={s.compactThRight}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {inputs.surfaces.map((surf, i) => (
                              <tr key={i}>
                                <td style={s.compactTd}>{surf.label}</td>
                                <td style={s.compactTdCenter}>{surf.area}</td>
                                <td style={s.compactTdRight}>
                                  {formatINR(surf.unitPrice)}
                                </td>
                                <td
                                  style={{
                                    ...s.compactTdRight,
                                    fontWeight: "500",
                                  }}
                                >
                                  {formatINR(surf.price)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}

                      {/* Electrical Items */}
                      <div style={s.electricalRow}>
                        <div style={s.electricalItem}>
                          <span style={s.electricalLabel}>Wiring</span>
                          <span style={s.electricalValue}>
                            {formatINR(inputs.electricalWiring)}
                          </span>
                        </div>
                        <div style={s.electricalItem}>
                          <span style={s.electricalLabel}>Electrician</span>
                          <span style={s.electricalValue}>
                            {formatINR(inputs.electricianCharges)}
                          </span>
                        </div>
                        <div style={s.electricalItem}>
                          <span style={s.electricalLabel}>Ceiling Lights</span>
                          <span style={s.electricalValue}>
                            {formatINR(inputs.ceilingLights)}
                          </span>
                        </div>
                        <div style={s.electricalItem}>
                          <span style={s.electricalLabel}>Profile Lights</span>
                          <span style={s.electricalValue}>
                            {formatINR(inputs.profileLights)}
                          </span>
                        </div>
                      </div>

                      {/* Painting Table */}
                      {inputs.ceilingPaintingArea > 0 && (
                        <table style={s.compactTable}>
                          <colgroup>
                            <col style={{ width: "40%" }} />
                            <col style={{ width: "30%" }} />
                            <col style={{ width: "30%" }} />
                          </colgroup>
                          <thead>
                            <tr style={s.compactTableHeader}>
                              <th style={s.compactThCenter}>Painting Area</th>
                              <th style={s.compactThRight}>Unit Price</th>
                              <th style={s.compactThRight}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td style={s.compactTdCenter}>
                                {inputs.ceilingPaintingArea} sqft
                              </td>
                              <td style={s.compactTdRight}>
                                {formatINR(inputs.ceilingPaintingUnitPrice)}
                              </td>
                              <td
                                style={{
                                  ...s.compactTdRight,
                                  fontWeight: "500",
                                }}
                              >
                                {formatINR(inputs.ceilingPaintingPrice)}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      )}
                    </>
                  )}

                  {ex.type === "area_based" && (
                    <table style={s.compactTable}>
                      <colgroup>
                        <col style={{ width: "40%" }} />
                        <col style={{ width: "30%" }} />
                        <col style={{ width: "30%" }} />
                      </colgroup>
                      <thead>
                        <tr style={s.compactTableHeader}>
                          <th style={s.compactThCenter}>Area (sqft)</th>
                          <th style={s.compactThRight}>Unit Price</th>
                          <th style={s.compactThRight}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={s.compactTdCenter}>{inputs.area}</td>
                          <td style={s.compactTdRight}>
                            {formatINR(inputs.unitPrice)}
                          </td>
                          <td
                            style={{ ...s.compactTdRight, fontWeight: "600" }}
                          >
                            {formatINR(ex.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {ex.type === "fixed" && (
                    <div style={s.fixedPriceDisplay}>
                      <span style={s.fixedPriceLabel}>Fixed Price Service</span>
                      <span style={s.fixedPriceValue}>
                        {formatINR(inputs.price)}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grand Total */}
      <div style={s.grandTotalSection}>
        <div style={s.summaryWrapper}>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Rooms Total</span>
            <span style={s.summaryValue}>{formatINR(roomsTotal)}</span>
          </div>

          {extras.length > 0 && (
            <div style={s.summaryRow}>
              <span style={s.summaryLabel}>Extras Total</span>
              <span style={s.summaryValue}>{formatINR(extrasTotal)}</span>
            </div>
          )}

          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Subtotal</span>
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
          <div style={s.termsSection}>
            {(company?.termsAndConditions ?? []).length > 0 && (
              <>
                <div style={s.termsTitle}>Terms & Conditions</div>
                {company.termsAndConditions.map((term, i) => (
                  <div key={i} style={s.termItem}>
                    <span style={s.termBullet}>•</span>
                    {term}
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={s.signatureSection}>
            <div style={s.signatureLabel}>For {company?.name}</div>
            <div style={s.signatureLine} />
            <div style={s.signatureNote}>Authorized Signatory</div>
          </div>
        </div>

        <div style={s.footerNote}>
          This is a computer generated invoice — valid without signature
        </div>
      </div>
    </div>
  );
});

export default AdminInvoiceT3;
