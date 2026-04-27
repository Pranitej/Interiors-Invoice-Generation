// src/components/ClientInvoiceT2.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoiceT2 = forwardRef(({ invoice, company }, ref) => {
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
  const totalFrameWork = roomsTotals.reduce(
    (sum, r) => sum + r.frameAreaTotal,
    0,
  );
  const totalBoxWork = roomsTotals.reduce((sum, r) => sum + r.boxAreaTotal, 0);
  const totalAccessoriesCount = rooms.reduce(
    (sum, r) => sum + (r.accessories?.length || 0),
    0,
  );
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
  /* PROFESSIONAL STYLES - NO BLUE, ONLY RED FOR DISCOUNT      */
  /* ========================================================= */

  const colors = {
    accent: "#d13b2e", // Red - only for discount
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
      borderBottom: `2px solid ${colors.gray[800]}`,
    },
    headerLeft: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
    },
    logoWrapper: {
      width: "48px",
      height: "48px",
      borderRadius: "8px",
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
      color: "#1d3254",
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
      borderRadius: "10px",
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
      color: "blue",
      textDecoration: "underline",
      fontSize: "11px",
    },

    // Rates banner - neutral colors
    ratesBanner: {
      backgroundColor: colors.gray[100],
      borderRadius: "8px",
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
      color: colors.gray[600],
    },
    rateValue: {
      fontSize: "15px",
      fontWeight: "700",
      color: colors.gray[800],
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
      letterSpacing: "-0.01em",
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
      borderRadius: "10px",
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
      color: colors.gray[700],
      backgroundColor: colors.gray[200],
      padding: "2px 8px",
      borderRadius: "4px",
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

    // Table styles
    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
    },
    th: {
      textAlign: "left",
      padding: "8px 12px",
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
      padding: "8px 12px",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.gray[500],
      backgroundColor: colors.gray[50],
      borderBottom: `1px solid ${colors.gray[200]}`,
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    tdLeft: {
      padding: "8px 12px",
      fontSize: "12px",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[100]}`,
      wordBreak: "break-word",
    },
    tdRight: {
      padding: "8px 12px",
      fontSize: "12px",
      textAlign: "right",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[100]}`,
    },

    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: colors.gray[50] },

    // Subtotal row
    subtotalRow: {
      backgroundColor: colors.gray[100],
    },
    subtotalLabel: {
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: "600",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[200]}`,
    },
    subtotalValue: {
      padding: "8px 12px",
      fontSize: "12px",
      fontWeight: "600",
      textAlign: "right",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[700],
      borderBottom: `1px solid ${colors.gray[200]}`,
    },

    // Room total
    roomTotalContainer: {
      textAlign: "right",
      marginTop: "8px",
      marginBottom: "4px",
      paddingRight: "12px",
      paddingBottom: "8px",
    },
    roomTotalText: {
      fontSize: "12px",
      fontWeight: "500",
      color: colors.gray[600],
    },
    roomTotalValue: {
      fontSize: "13px",
      fontWeight: "700",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
      marginLeft: "8px",
    },

    // Accessories table
    accessoriesTable: {
      width: "100%",
      borderCollapse: "collapse",
      marginTop: "0",
      tableLayout: "fixed",
    },

    // Work summary section
    workSummaryGrid: {
      display: "flex",
      gap: "12px",
      marginBottom: "20px",
    },
    workSummaryCard: {
      flex: 1,
      backgroundColor: colors.gray[50],
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "10px",
      padding: "14px 16px",
    },
    workSummaryLabel: {
      fontSize: "11px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
      marginBottom: "6px",
    },
    workSummaryValue: {
      fontSize: "16px",
      fontWeight: "700",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Extras section
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
    extraDetails: {
      padding: "12px",
    },
    extraDetailRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      borderBottom: `1px solid ${colors.gray[100]}`,
    },
    extraDetailLabel: {
      fontSize: "11px",
      color: colors.gray[500],
    },
    extraDetailValue: {
      fontSize: "12px",
      fontWeight: "500",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[700],
    },
    fixedPriceContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 0",
    },
    extraTotalRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 12px",
      backgroundColor: colors.gray[50],
      borderTop: `1px solid ${colors.gray[200]}`,
    },
    extraTotalLabel: {
      fontSize: "11px",
      fontWeight: "600",
      color: colors.gray[600],
    },
    extraTotalValue: {
      fontSize: "13px",
      fontWeight: "700",
      fontFamily: "'SF Mono', monospace",
      color: colors.gray[800],
    },

    // Summary section
    summaryContainer: {
      marginTop: "24px",
      marginBottom: "24px",
      display: "flex",
      justifyContent: "flex-end",
    },
    summaryBox: {
      backgroundColor: "#ffffff",
      border: `1px solid ${colors.gray[200]}`,
      borderRadius: "10px",
      padding: "16px 20px",
      width: "50%",
    },
    summaryRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      color: colors.gray[600],
    },
    summaryLabel: {
      fontSize: "12px",
      fontWeight: "400",
    },
    summaryValue: {
      fontSize: "13px",
      fontFamily: "'SF Mono', monospace",
      fontWeight: "500",
    },
    summaryDiscountRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "6px 0",
      color: colors.accent,
    },
    summaryDiscountLabel: {
      fontSize: "12px",
      fontWeight: "400",
    },
    summaryDiscountValue: {
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
      borderTop: `2px solid ${colors.gray[800]}`,
    },
    finalLabel: {
      fontSize: "15px",
      fontWeight: "700",
      color: colors.gray[800],
    },
    finalValue: {
      fontSize: "20px",
      fontWeight: "700",
      color: colors.gray[800],
      fontFamily: "'SF Mono', monospace",
    },

    // Footer
    footer: {
      borderTop: `1px solid ${colors.gray[200]}`,
      paddingTop: "20px",
      marginTop: "16px",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },
    footerSection: {
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    footerTitle: {
      fontSize: "10px",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      color: colors.gray[500],
    },
    footerText: {
      fontSize: "11px",
      color: colors.gray[600],
      margin: 0,
    },
    footerList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    footerListItem: {
      fontSize: "10px",
      color: colors.gray[600],
      marginBottom: "4px",
      display: "flex",
      gap: "6px",
    },
    thankYou: {
      textAlign: "center",
      marginTop: "20px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.gray[100]}`,
      fontSize: "11px",
      color: colors.gray[500],
    },
  };

  // Column width definitions for tables
  const accessoriesCols = {
    name: "45%",
    qty: "15%",
    rate: "15%",
    amount: "25%",
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
          {client.siteMapLink && (
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

      {/* Pricing Rates Banner - Neutral */}
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
        <div style={s.rateNote}>Room-specific rates may vary</div>
      </div>

      {/* Rooms Section */}
      {rooms.length > 0 && (
        <>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Rooms Breakdown</div>
            <span style={s.sectionBadge}>{rooms.length} room(s)</span>
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
            const roomNumberStr = String(idx + 1).padStart(2, "0");

            return (
              <div key={idx} style={s.roomCard}>
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
                      <span style={s.roomRateSpan}>
                        {formatINR(roomFrameRate)}
                      </span>
                    </span>
                    <span style={s.roomRate}>
                      Box:{" "}
                      <span style={s.roomRateSpan}>
                        {formatINR(roomBoxRate)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Work items table */}
                <table style={s.table}>
                  <colgroup>
                    <col style={{ width: "30%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={s.th}>Item</th>
                      <th style={s.th}>Type</th>
                      <th style={s.thRight}>Area (sqft)</th>
                      <th style={s.thRight}>Rate</th>
                      <th style={s.thRight}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(room.items || []).map((item, itemIndex) => {
                      const hasFrame =
                        item.frame && Number(item.frame.area) > 0;
                      const hasBox = item.box && Number(item.box.area) > 0;
                      const itemTotal =
                        (Number(item.frame?.price) || 0) +
                        (Number(item.box?.price) || 0);
                      const rowSpan = hasFrame && hasBox ? 2 : 1;
                      const rowStyle =
                        itemIndex % 2 === 0 ? s.rowEven : s.rowOdd;
                      return (
                        <React.Fragment key={itemIndex}>
                          {hasFrame && (
                            <tr style={rowStyle}>
                              {rowSpan > 1 ? (
                                <td style={s.tdLeft} rowSpan={rowSpan}>
                                  {item.name}
                                </td>
                              ) : (
                                <td style={s.tdLeft}>{item.name}</td>
                              )}
                              <td style={s.tdLeft}>Frame</td>
                              <td style={s.tdRight}>
                                {Number(item.frame.area).toFixed(2)}
                              </td>
                              <td style={s.tdRight}>
                                {formatINR(item.frame.price)}
                              </td>
                              {rowSpan > 1 ? (
                                <td style={s.tdRight} rowSpan={rowSpan}>
                                  {formatINR(itemTotal)}
                                </td>
                              ) : (
                                <td style={s.tdRight}>
                                  {formatINR(itemTotal)}
                                </td>
                              )}
                            </tr>
                          )}
                          {hasBox && (
                            <tr style={rowStyle}>
                              {!hasFrame && (
                                <td style={s.tdLeft}>{item.name}</td>
                              )}
                              <td style={s.tdLeft}>Box</td>
                              <td style={s.tdRight}>
                                {Number(item.box.area).toFixed(2)}
                              </td>
                              <td style={s.tdRight}>
                                {formatINR(item.box.price)}
                              </td>
                              {!hasFrame && (
                                <td style={s.tdRight}>
                                  {formatINR(itemTotal)}
                                </td>
                              )}
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                    <tr style={s.subtotalRow}>
                      <td style={s.subtotalLabel} colSpan="4">
                        Room Items Subtotal
                      </td>
                      <td style={s.subtotalValue}>
                        {formatINR(agg.itemsTotal || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Accessories table */}
                {agg.accessories?.length > 0 && (
                  <table style={s.accessoriesTable}>
                    <colgroup>
                      <col style={{ width: accessoriesCols.name }} />
                      <col style={{ width: accessoriesCols.qty }} />
                      <col style={{ width: accessoriesCols.rate }} />
                      <col style={{ width: accessoriesCols.amount }} />
                    </colgroup>
                    <thead>
                      <tr>
                        <th style={s.th}>Accessory</th>
                        <th style={s.thRight}>Qty</th>
                        <th style={s.thRight}>Rate</th>
                        <th style={s.thRight}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agg.accessories.map((acc, i) => (
                        <tr key={i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                          <td style={s.tdLeft}>{acc.name || "Accessory"}</td>
                          <td style={s.tdRight}>{acc.qty || 1}</td>
                          <td style={s.tdRight}>{formatINR(acc.price || 0)}</td>
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
                )}

                <div style={s.roomTotalContainer}>
                  <span style={s.roomTotalText}>Room Total:</span>
                  <span style={s.roomTotalValue}>
                    {formatINR(agg.roomTotal || 0)}
                  </span>
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Work Summary */}
      {rooms.length > 0 && (
        <>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Work Summary</div>
          </div>
          <div style={s.workSummaryGrid}>
            <div style={s.workSummaryCard}>
              <div style={s.workSummaryLabel}>Total Frame Work</div>
              <div style={s.workSummaryValue}>
                {totalFrameWork.toFixed(2) + " "}
                <small>SQFT</small>
              </div>
            </div>
            <div style={s.workSummaryCard}>
              <div style={s.workSummaryLabel}>Total Box Work</div>
              <div style={s.workSummaryValue}>
                {totalBoxWork.toFixed(2) + " "}
                <small>SQFT</small>
              </div>
            </div>
            <div style={s.workSummaryCard}>
              <div style={s.workSummaryLabel}>Total Accessories</div>
              <div style={s.workSummaryValue}>
                {totalAccessoriesCount} item
                {totalAccessoriesCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Extras Section */}
      {extras.length > 0 && (
        <>
          <div style={s.sectionHeader}>
            <div style={s.sectionTitle}>Additional Services</div>
            <span style={s.sectionBadge}>{extras.length} service(s)</span>
          </div>
          <div style={s.extrasGrid}>
            {extras.map((ex, idx) => {
              const inputs = safeInputs(ex.inputs || {});
              const key = ex._id || idx;

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
                  <div style={s.extraDetails}>
                    {ex.type === "ceiling" && (
                      <>
                        {inputs.surfaces?.length > 0 && (
                          <div style={s.extraDetailRow}>
                            <span style={s.extraDetailLabel}>Surfaces</span>
                            <span style={s.extraDetailValue}>
                              {inputs.surfaces.map((surf) => surf.label).join(", ")}
                            </span>
                          </div>
                        )}
                        {inputs.electricalWiring > 0 && (
                          <div style={s.extraDetailRow}>
                            <span style={s.extraDetailLabel}>
                              Electrical Wiring
                            </span>
                            <span style={s.extraDetailValue}>
                              {formatINR(inputs.electricalWiring)}
                            </span>
                          </div>
                        )}
                        {inputs.electricianCharges > 0 && (
                          <div style={s.extraDetailRow}>
                            <span style={s.extraDetailLabel}>
                              Electrician Charges
                            </span>
                            <span style={s.extraDetailValue}>
                              {formatINR(inputs.electricianCharges)}
                            </span>
                          </div>
                        )}
                        {inputs.ceilingLights > 0 && (
                          <div style={s.extraDetailRow}>
                            <span style={s.extraDetailLabel}>
                              Ceiling Lights
                            </span>
                            <span style={s.extraDetailValue}>
                              {formatINR(inputs.ceilingLights)}
                            </span>
                          </div>
                        )}
                        {inputs.profileLights > 0 && (
                          <div style={s.extraDetailRow}>
                            <span style={s.extraDetailLabel}>
                              Profile Lights
                            </span>
                            <span style={s.extraDetailValue}>
                              {formatINR(inputs.profileLights)}
                            </span>
                          </div>
                        )}
                        {inputs.ceilingPaintingArea > 0 && (
                          <>
                            <div style={s.extraDetailRow}>
                              <span style={s.extraDetailLabel}>
                                Painting Area
                              </span>
                              <span style={s.extraDetailValue}>
                                {inputs.ceilingPaintingArea} sq.ft
                              </span>
                            </div>
                            <div style={s.extraDetailRow}>
                              <span style={s.extraDetailLabel}>
                                Painting Unit Price
                              </span>
                              <span style={s.extraDetailValue}>
                                {formatINR(inputs.ceilingPaintingUnitPrice)}
                              </span>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {ex.type === "area_based" && (
                      <>
                        <div style={s.extraDetailRow}>
                          <span style={s.extraDetailLabel}>Area</span>
                          <span style={s.extraDetailValue}>
                            {inputs.area} sq.ft
                          </span>
                        </div>
                        <div style={s.extraDetailRow}>
                          <span style={s.extraDetailLabel}>Unit Price</span>
                          <span style={s.extraDetailValue}>
                            {formatINR(inputs.unitPrice)}
                          </span>
                        </div>
                      </>
                    )}
                    {ex.type === "fixed" && (
                      <div style={s.fixedPriceContainer}>
                        <span style={s.extraDetailLabel}>Fixed Price</span>
                        <span style={s.extraDetailValue}>
                          {formatINR(inputs.price)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={s.extraTotalRow}>
                    <span style={s.extraTotalLabel}>Service Total</span>
                    <span style={s.extraTotalValue}>{formatINR(ex.total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Summary Section - Only Red for Discount */}
      <div style={s.summaryContainer}>
        <div style={s.summaryBox}>
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
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Sub Total</span>
            <span style={s.summaryValue}>{formatINR(grandTotal)}</span>
          </div>
          {safeDiscount > 0 && (
            <>
              <div style={s.divider} />
              <div style={s.summaryDiscountRow}>
                <span style={s.summaryDiscountLabel}>Discount</span>
                <span style={s.summaryDiscountValue}>
                  - {formatINR(safeDiscount)}
                </span>
              </div>
            </>
          )}
          <div style={s.finalRow}>
            <span style={s.finalLabel}>Final Amount</span>
            <span style={s.finalValue}>{formatINR(finalPayable)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerSection}>
          <div style={s.footerTitle}>Contact Details</div>
          <p style={s.footerText}>{company?.phones?.join(" | ")}</p>
          <p style={s.footerText}>{company?.email}</p>
        </div>
        <div style={s.footerSection}>
          <div style={s.footerTitle}>Terms</div>
          {(company?.termsAndConditions ?? []).length > 0 ? (
            <ul style={s.footerList}>
              {company.termsAndConditions.map((t, i) => (
                <li key={i} style={s.footerListItem}>
                  <span>{String(i + 1).padStart(2, "0")}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          ) : (
            <ul style={s.footerList}>
              <li style={s.footerListItem}>
                <span>01.</span>
                <span>Quotation valid for 30 days</span>
              </li>
              <li style={s.footerListItem}>
                <span>02.</span>
                <span>Final values based on site measurement</span>
              </li>
              <li style={s.footerListItem}>
                <span>03.</span>
                <span>40% advance, 60% on completion</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div style={s.thankYou}>
        Thank you for considering {company?.name}. We look forward to serving
        you.
      </div>
    </div>
  );
});

export default ClientInvoiceT2;
