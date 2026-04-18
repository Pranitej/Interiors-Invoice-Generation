// src/components/AdminInvoiceT2.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const AdminInvoiceT2 = forwardRef(function AdminInvoiceT2(
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
  /* COMPACT MODERN STYLES                                     */
  /* ========================================================= */

  const colors = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    gray: {
      50: "#f9fafb",
      100: "#f3f4f6",
      200: "#e5e7eb",
      300: "#d1d5db",
      400: "#9ca3af",
      500: "#6b7280",
      600: "#4b5563",
      700: "#374151",
      800: "#1f2937",
      900: "#111827",
    },
  };

  const s = {
    page: {
      backgroundColor: "#ffffff",
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "24px 32px",
      fontFamily:
        "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      color: colors.gray[700],
      lineHeight: 1.4,
      fontSize: "12px",
    },

    // Header
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "28px",
      paddingBottom: "16px",
      borderBottom: `1px solid ${colors.gray[200]}`,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
    },
    logoWrapper: {
      width: "48px",
      height: "48px",
      borderRadius: "10px",
      backgroundColor: colors.gray[100],
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    companyInfo: {
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    companyName: {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.gray[900],
      margin: 0,
    },
    companyDetail: {
      fontSize: "11px",
      color: colors.gray[500],
      margin: 0,
    },
    headerRight: {
      textAlign: "right",
    },
    invoiceTitle: {
      fontSize: "24px",
      fontWeight: "700",
      color: colors.gray[900],
      margin: 0,
      letterSpacing: "-0.02em",
    },
    invoiceSubtitle: {
      fontSize: "11px",
      color: colors.gray[500],
      marginTop: "2px",
    },

    // Info grid
    infoGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "16px",
      marginBottom: "24px",
    },
    infoCard: {
      backgroundColor: colors.gray[50],
      borderRadius: "12px",
      padding: "14px 16px",
      border: `1px solid ${colors.gray[200]}`,
    },
    cardTitle: {
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
      marginBottom: "12px",
    },
    infoRow: {
      display: "flex",
      marginBottom: "8px",
      fontSize: "12px",
    },
    infoLabel: {
      width: "90px",
      fontWeight: "500",
      color: colors.gray[600],
    },
    infoValue: {
      flex: 1,
      color: colors.gray[800],
    },
    locationLink: {
      color: colors.primary,
      textDecoration: "none",
      fontSize: "11px",
    },

    // Rates banner
    ratesBanner: {
      backgroundColor: colors.primaryLight,
      borderRadius: "10px",
      padding: "10px 16px",
      marginBottom: "28px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "12px",
    },
    rateItem: {
      display: "flex",
      alignItems: "baseline",
      gap: "6px",
    },
    rateLabel: {
      fontSize: "11px",
      fontWeight: "500",
      color: colors.primary,
    },
    rateValue: {
      fontSize: "15px",
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "'SF Mono', monospace",
    },
    rateNote: {
      fontSize: "10px",
      color: colors.gray[500],
    },

    // Section headers
    sectionHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
      marginTop: "20px",
    },
    sectionTitle: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.gray[900],
    },
    sectionBadge: {
      backgroundColor: colors.gray[100],
      padding: "2px 10px",
      borderRadius: "16px",
      fontSize: "11px",
      fontWeight: "500",
      color: colors.gray[600],
    },

    // Room card
    roomCard: {
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "12px",
      marginBottom: "16px",
      overflow: "hidden",
    },
    roomHeader: {
      backgroundColor: colors.gray[50],
      padding: "10px 16px",
      borderBottom: `1px solid ${colors.gray[200]}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "8px",
    },
    roomTitleWrapper: {
      display: "flex",
      alignItems: "center",
      gap: "8px",
      flexWrap: "wrap",
    },
    roomNumber: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.primary,
      backgroundColor: colors.primaryLight,
      padding: "2px 8px",
      borderRadius: "5px",
      fontFamily: "'SF Mono', monospace",
    },
    roomName: {
      fontSize: "13px",
      fontWeight: "600",
      color: colors.gray[800],
    },
    roomDesc: {
      fontSize: "11px",
      color: colors.gray[500],
    },
    roomRates: {
      display: "flex",
      gap: "12px",
      fontSize: "11px",
    },
    roomRate: {
      color: colors.gray[600],
    },
    roomRateSpan: {
      fontWeight: "600",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Table styles - FIXED COLUMN WIDTHS FOR ALIGNMENT
    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
    },
    th: {
      textAlign: "left",
      padding: "8px 10px",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.gray[500],
      backgroundColor: colors.gray[50],
      borderBottom: `1px solid ${colors.gray[200]}`,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    thRight: {
      textAlign: "right",
      padding: "8px 10px",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.gray[500],
      backgroundColor: colors.gray[50],
      borderBottom: `1px solid ${colors.gray[200]}`,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    thCenter: {
      textAlign: "center",
      padding: "8px 10px",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.gray[500],
      backgroundColor: colors.gray[50],
      borderBottom: `1px solid ${colors.gray[200]}`,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    td: {
      padding: "8px 10px",
      fontSize: "12px",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[100]}`,
      verticalAlign: "top",
      wordBreak: "break-word",
    },
    tdRight: {
      padding: "8px 10px",
      fontSize: "12px",
      textAlign: "right",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[100]}`,
      verticalAlign: "top",
    },
    tdCenter: {
      padding: "8px 10px",
      fontSize: "12px",
      textAlign: "center",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[100]}`,
      verticalAlign: "top",
    },

    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: colors.gray[50] },

    // Room subtotal
    roomSubtotal: {
      padding: "8px 16px",
      backgroundColor: colors.gray[50],
      borderTop: `1px solid ${colors.gray[200]}`,
      display: "flex",
      justifyContent: "flex-end",
      alignItems: "center",
      gap: "12px",
    },
    roomSubtotalLabel: {
      fontSize: "11px",
      fontWeight: "500",
      color: colors.gray[600],
    },
    roomSubtotalValue: {
      fontSize: "13px",
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "'SF Mono', monospace",
    },

    // Accessories table
    accessoriesTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "0",
      tableLayout: "fixed",
    },

    // Extras section - COMPACT LAYOUT
    extrasGrid: {
      display: "grid",
      gap: "12px",
      marginBottom: "24px",
    },
    extraCard: {
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "10px",
      overflow: "hidden",
    },
    extraHeader: {
      backgroundColor: colors.gray[50],
      padding: "8px 14px",
      borderBottom: `1px solid ${colors.gray[200]}`,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      flexWrap: "wrap",
    },
    extraLabel: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.gray[800],
    },
    extraType: {
      fontSize: "9px",
      color: colors.gray[500],
      backgroundColor: colors.gray[100],
      padding: "2px 8px",
      borderRadius: "10px",
    },
    extraBody: {
      padding: "12px",
    },
    serviceTotal: {
      padding: "6px 14px",
      backgroundColor: colors.gray[50],
      borderTop: `1px solid ${colors.gray[200]}`,
      textAlign: "right",
      fontSize: "11px",
      fontWeight: "500",
      color: colors.gray[700],
    },

    // Stats grid for ceiling
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "8px",
      marginTop: "10px",
    },
    statCard: {
      backgroundColor: colors.gray[50],
      borderRadius: "6px",
      padding: "6px 8px",
      textAlign: "center",
    },
    statLabel: {
      fontSize: "8px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
      marginBottom: "3px",
    },
    statValue: {
      fontSize: "12px",
      fontWeight: "600",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Painting grid
    paintingGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "8px",
      marginTop: "10px",
    },

    // Area based services - COMPACT ROW LAYOUT
    areaBasedRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: "12px",
      backgroundColor: colors.gray[50],
      borderRadius: "8px",
      padding: "8px 12px",
    },
    areaBasedItem: {
      flex: 1,
      textAlign: "center",
    },
    areaBasedLabel: {
      fontSize: "9px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
      marginBottom: "2px",
    },
    areaBasedValue: {
      fontSize: "13px",
      fontWeight: "600",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Fixed price - COMPACT
    fixedPriceContainer: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.gray[50],
      borderRadius: "8px",
      padding: "8px 12px",
    },
    fixedPriceLabel: {
      fontSize: "9px",
      fontWeight: "500",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
      marginRight: "12px",
    },
    fixedPriceValue: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Totals panel - WHITE BACKGROUND
    totalsPanel: {
      backgroundColor: "#ffffff",
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "12px",
      padding: "16px 20px",
      marginTop: "24px",
      marginBottom: "24px",
      boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    },
    totalsRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      color: colors.gray[600],
    },
    totalsLabel: {
      fontSize: "12px",
      fontWeight: "400",
    },
    totalsValue: {
      fontSize: "13px",
      fontFamily: "'SF Mono', monospace",
      fontWeight: "500",
    },
    discountRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      color: colors.error,
    },
    discountLabel: {
      fontSize: "12px",
      fontWeight: "400",
    },
    discountValue: {
      fontSize: "13px",
      fontFamily: "'SF Mono', monospace",
      fontWeight: "500",
    },
    divider: {
      height: "1px",
      backgroundColor: colors.gray[200],
      margin: "8px 0",
    },
    finalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: "12px",
      marginTop: "4px",
      borderTop: `2px solid ${colors.primary}`,
    },
    finalLabel: {
      fontSize: "15px",
      fontWeight: "700",
      color: colors.gray[800],
    },
    finalValue: {
      fontSize: "20px",
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "'SF Mono', monospace",
    },

    // Footer
    footer: {
      borderTop: `1px solid ${colors.gray[200]}`,
      paddingTop: "16px",
      marginTop: "8px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    termsSection: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    termsTitle: {
      fontSize: "10px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
    },
    termsList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    termsItem: {
      fontSize: "10px",
      color: colors.gray[600],
      marginBottom: "4px",
      display: "flex",
      gap: "6px",
    },
    signatureSection: {
      textAlign: "right",
    },
    signatureText: {
      fontSize: "11px",
      color: colors.gray[600],
    },
    signatureNote: {
      fontSize: "9px",
      color: colors.gray[400],
      marginTop: "6px",
    },
  };

  const getRowStyle = (idx) => (idx % 2 === 0 ? s.rowEven : s.rowOdd);

  // Column widths for main table
  const colWidths = {
    item: "25%",
    type: "10%",
    w: "8%",
    h: "8%",
    d: "8%",
    area: "12%",
    price: "14%",
    total: "15%",
  };

  return (
    <div ref={ref} style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.logoWrapper}>
            {logoURL ? (
              <img
                src={logoURL}
                alt={`${company?.name} Logo`}
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    '<span style="font-size:20px;">🏢</span>';
                }}
              />
            ) : (
              <span style={{ fontSize: "20px" }}>🏢</span>
            )}
          </div>
          <div style={s.companyInfo}>
            <div style={s.companyName}>{company?.name}</div>
            <div style={s.companyDetail}>{company?.registeredOffice}</div>
            {company?.industryAddress && (
              <div style={s.companyDetail}>{company.industryAddress}</div>
            )}
            <div style={s.companyDetail}>
              {company?.phones?.join(", ")} | {company?.email}
            </div>
          </div>
        </div>
        <div style={s.headerRight}>
          <div style={s.invoiceTitle}>INVOICE</div>
          <div style={s.invoiceSubtitle}>
            {invoice.invoiceType ? invoice.invoiceType : "PROFORMA"}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div style={s.infoGrid}>
        <div style={s.infoCard}>
          <div style={s.cardTitle}>CLIENT INFORMATION</div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Name</div>
            <div style={s.infoValue}>{client.name || "—"}</div>
          </div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Mobile</div>
            <div style={s.infoValue}>{client.mobile || "—"}</div>
          </div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Email</div>
            <div style={s.infoValue}>{client.email || "—"}</div>
          </div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Site Address</div>
            <div style={s.infoValue}>{client.siteAddress || "—"}</div>
          </div>
          {useCurrentLocation && client.siteMapLink && (
            <div style={s.infoRow}>
              <div style={s.infoLabel}>Location Map</div>
              <div style={s.infoValue}>
                <a
                  href={client.siteMapLink}
                  target="_blank"
                  rel="noreferrer"
                  style={s.locationLink}
                >
                  View on Map →
                </a>
              </div>
            </div>
          )}
        </div>

        <div style={s.infoCard}>
          <div style={s.cardTitle}>INVOICE DETAILS</div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Invoice No.</div>
            <div style={s.infoValue}>{invoiceIdShort || "—"}</div>
          </div>
          <div style={s.infoRow}>
            <div style={s.infoLabel}>Date</div>
            <div style={s.infoValue}>{invoiceDate || "—"}</div>
          </div>
        </div>
      </div>

      {/* Pricing Rates Banner */}
      <div style={s.ratesBanner}>
        <div style={s.rateItem}>
          <span style={s.rateLabel}>Frame Rate</span>
          <span style={s.rateValue}>
            {frameworkRate ? formatINR(frameworkRate) : "—"}
          </span>
          <span style={s.rateNote}>/ sqft</span>
        </div>
        <div style={s.rateItem}>
          <span style={s.rateLabel}>Box Rate</span>
          <span style={s.rateValue}>
            {boxRate
              ? formatINR(boxRate)
              : frameworkRate
                ? formatINR(frameworkRate * 1.4)
                : "—"}
          </span>
          <span style={s.rateNote}>/ sqft</span>
        </div>
        <div style={s.rateNote}>Room-specific rates override global rates</div>
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
        const roomNumberStr = String(roomIndex + 1).padStart(2, "0");

        return (
          <div key={roomIndex} style={s.roomCard}>
            <div style={s.roomHeader}>
              <div style={s.roomTitleWrapper}>
                <span style={s.roomNumber}>#{roomNumberStr}</span>
                <span style={s.roomName}>
                  {room.name || `Room ${roomNumberStr}`}
                </span>
                {room.description && (
                  <span style={s.roomDesc}>{room.description}</span>
                )}
              </div>
              <div style={s.roomRates}>
                <span style={s.roomRate}>
                  Frame:{" "}
                  <span style={s.roomRateSpan}>{formatINR(roomFrameRate)}</span>
                </span>
                <span style={s.roomRate}>
                  Box:{" "}
                  <span style={s.roomRateSpan}>{formatINR(roomBoxRate)}</span>
                </span>
              </div>
            </div>

            {/* Items Table - FIXED COLUMN ALIGNMENT */}
            {(room.items || []).length > 0 && (
              <table style={s.table}>
                <colgroup>
                  <col style={{ width: colWidths.item }} />
                  <col style={{ width: colWidths.type }} />
                  <col style={{ width: colWidths.w }} />
                  <col style={{ width: colWidths.h }} />
                  <col style={{ width: colWidths.d }} />
                  <col style={{ width: colWidths.area }} />
                  <col style={{ width: colWidths.price }} />
                  <col style={{ width: colWidths.total }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={s.th}>Item</th>
                    <th style={s.thCenter}>Type</th>
                    <th style={s.thCenter}>W</th>
                    <th style={s.thCenter}>H</th>
                    <th style={s.thCenter}>D</th>
                    <th style={s.thCenter}>Area</th>
                    <th style={s.thRight}>Price</th>
                    <th style={s.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(room.items || []).map((item, itemIndex) => {
                    const hasFrame = item.frame && item.frame.area > 0;
                    const hasBox = item.box && item.box.area > 0;
                    const itemTotal = calculateItemTotal(item);
                    const rowSpan = hasFrame && hasBox ? 2 : 1;
                    const rowStyle = getRowStyle(itemIndex);

                    return (
                      <React.Fragment key={itemIndex}>
                        {hasFrame && (
                          <tr style={rowStyle}>
                            {rowSpan > 1 ? (
                              <td
                                rowSpan={rowSpan}
                                style={{ ...s.td, fontWeight: 500 }}
                              >
                                {item.name}
                              </td>
                            ) : (
                              <td style={{ ...s.td, fontWeight: 500 }}>
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
                                style={{ ...s.tdRight, fontWeight: 600 }}
                              >
                                {formatINR(itemTotal)}
                              </td>
                            ) : (
                              <td style={{ ...s.tdRight, fontWeight: 600 }}>
                                {formatINR(itemTotal)}
                              </td>
                            )}
                          </tr>
                        )}
                        {hasBox && (
                          <tr style={rowStyle}>
                            {!hasFrame && (
                              <td style={{ ...s.td, fontWeight: 500 }}>
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
                              <td style={{ ...s.tdRight, fontWeight: 600 }}>
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

            {/* Accessories Table - FIXED COLUMN ALIGNMENT */}
            {room.accessories?.length > 0 && (
              <table style={s.accessoriesTable}>
                <colgroup>
                  <col style={{ width: "50%" }} />
                  <col style={{ width: "20%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "15%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th
                      colSpan="4"
                      style={{
                        ...s.th,
                        borderBottom: `1px solid ${colors.gray[200]}`,
                        paddingLeft: "10px",
                      }}
                    >
                      Accessories
                    </th>
                  </tr>
                  <tr>
                    <th style={s.th}>Name</th>
                    <th style={s.thRight}>Unit Price</th>
                    <th style={s.thCenter}>Qty</th>
                    <th style={s.thRight}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {room.accessories.map((acc, idx) => {
                    const total = (acc.price || 0) * (acc.qty || 0);
                    const rowStyle = getRowStyle(idx);
                    return (
                      <tr key={idx} style={rowStyle}>
                        <td style={s.td}>{acc.name}</td>
                        <td style={s.tdRight}>{formatINR(acc.price)}</td>
                        <td style={s.tdCenter}>{acc.qty}</td>
                        <td style={s.tdRight}>{formatINR(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            <div style={s.roomSubtotal}>
              <span style={s.roomSubtotalLabel}>Room Total</span>
              <span style={s.roomSubtotalValue}>{formatINR(roomTotal)}</span>
            </div>
          </div>
        );
      })}

      {/* Extras Section - FIXED LAYOUT */}
      {extras.length > 0 && (
        <>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Additional Services</div>
            <span style={s.sectionBadge}>{extras.length} service(s)</span>
          </div>
          <div style={s.extrasGrid}>
            {extras.map((ex) => {
              const inputs = safeInputs(ex.inputs || {});
              const key = ex._id || ex.id || ex.key;

              return (
                <div key={key} style={s.extraCard}>
                  <div style={s.extraHeader}>
                    <span style={s.extraLabel}>{ex.label}</span>
                    <span style={s.extraType}>
                      {ex.type === "ceiling"
                        ? "Ceiling Work"
                        : ex.type === "area_based"
                          ? "Area Based"
                          : "Fixed Price"}
                    </span>
                  </div>
                  <div style={s.extraBody}>
                    {ex.type === "ceiling" && (
                      <>
                        {inputs.surfaces.length > 0 && (
                          <table style={s.table}>
                            <thead>
                              <tr>
                                <th style={s.th}>Surface</th>
                                <th style={s.thRight}>Area (sqft)</th>
                                <th style={s.thRight}>Unit Price</th>
                                <th style={s.thRight}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {inputs.surfaces.map((surf, i) => (
                                <tr key={i} style={getRowStyle(i)}>
                                  <td style={s.td}>{surf.label}</td>
                                  <td style={s.tdRight}>{surf.area}</td>
                                  <td style={s.tdRight}>
                                    {formatINR(surf.unitPrice)}
                                  </td>
                                  <td style={s.tdRight}>
                                    {formatINR(surf.price)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        <div style={s.statsGrid}>
                          <div style={s.statCard}>
                            <div style={s.statLabel}>Electrical Wiring</div>
                            <div style={s.statValue}>
                              {formatINR(inputs.electricalWiring)}
                            </div>
                          </div>
                          <div style={s.statCard}>
                            <div style={s.statLabel}>Electrician Charges</div>
                            <div style={s.statValue}>
                              {formatINR(inputs.electricianCharges)}
                            </div>
                          </div>
                          <div style={s.statCard}>
                            <div style={s.statLabel}>Ceiling Lights</div>
                            <div style={s.statValue}>
                              {formatINR(inputs.ceilingLights)}
                            </div>
                          </div>
                          <div style={s.statCard}>
                            <div style={s.statLabel}>Profile Lights</div>
                            <div style={s.statValue}>
                              {formatINR(inputs.profileLights)}
                            </div>
                          </div>
                        </div>
                        {inputs.ceilingPaintingArea > 0 && (
                          <div style={s.paintingGrid}>
                            <div style={s.statCard}>
                              <div style={s.statLabel}>Painting Area</div>
                              <div style={s.statValue}>
                                {inputs.ceilingPaintingArea} sqft
                              </div>
                            </div>
                            <div style={s.statCard}>
                              <div style={s.statLabel}>Unit Price</div>
                              <div style={s.statValue}>
                                {formatINR(inputs.ceilingPaintingUnitPrice)}
                              </div>
                            </div>
                            <div style={s.statCard}>
                              <div style={s.statLabel}>Painting Total</div>
                              <div style={s.statValue}>
                                {formatINR(inputs.ceilingPaintingPrice)}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {ex.type === "area_based" && (
                      <div style={s.areaBasedRow}>
                        <div style={s.areaBasedItem}>
                          <div style={s.areaBasedLabel}>Area (sqft)</div>
                          <div style={s.areaBasedValue}>{inputs.area}</div>
                        </div>
                        <div style={s.areaBasedItem}>
                          <div style={s.areaBasedLabel}>Unit Price</div>
                          <div style={s.areaBasedValue}>
                            {formatINR(inputs.unitPrice)}
                          </div>
                        </div>
                        <div style={s.areaBasedItem}>
                          <div style={s.areaBasedLabel}>Total</div>
                          <div style={s.areaBasedValue}>
                            {formatINR(ex.total)}
                          </div>
                        </div>
                      </div>
                    )}

                    {ex.type === "fixed" && (
                      <div style={s.fixedPriceContainer}>
                        <span style={s.fixedPriceLabel}>Fixed Price</span>
                        <span style={s.fixedPriceValue}>
                          {formatINR(inputs.price)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={s.serviceTotal}>
                    Service Total: {formatINR(ex.total)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Totals Panel - WHITE BACKGROUND */}
      <div style={s.totalsPanel}>
        <div style={s.totalsRow}>
          <span style={s.totalsLabel}>Rooms Total</span>
          <span style={s.totalsValue}>{formatINR(roomsTotal)}</span>
        </div>
        {extras.length > 0 && (
          <div style={s.totalsRow}>
            <span style={s.totalsLabel}>Extras Total</span>
            <span style={s.totalsValue}>{formatINR(extrasTotal)}</span>
          </div>
        )}
        <div style={s.totalsRow}>
          <span style={s.totalsLabel}>Sub Total</span>
          <span style={s.totalsValue}>{formatINR(grandTotal)}</span>
        </div>
        {safeDiscount > 0 && (
          <>
            <div style={s.divider} />
            <div style={s.discountRow}>
              <span style={s.discountLabel}>Discount</span>
              <span style={s.discountValue}>- {formatINR(safeDiscount)}</span>
            </div>
          </>
        )}
        <div style={s.finalRow}>
          <span style={s.finalLabel}>Final Amount</span>
          <span style={s.finalValue}>{formatINR(finalPayable)}</span>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.termsSection}>
          {(company?.termsAndConditions ?? []).length > 0 && (
            <>
              <div style={s.termsTitle}>Terms & Conditions</div>
              <ul style={s.termsList}>
                {company.termsAndConditions.map((term, i) => (
                  <li key={i} style={s.termsItem}>
                    <span>{String(i + 1).padStart(2, "0")}.</span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div style={s.signatureSection}>
          <div style={s.signatureText}>For {company?.name}</div>
          <div style={{ marginTop: "16px" }}>
            <div style={s.signatureText}>Authorized Signatory</div>
            <div style={s.signatureNote}>
              Computer Generated Invoice - Valid without signature
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminInvoiceT2;
