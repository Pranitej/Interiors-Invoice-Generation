// src/components/ClientInvoiceT1.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoiceT1 = forwardRef(({ invoice, company }, ref) => {
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

  const logoURL = company?.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
    : null;

  /* ========================================================= */
  /* STYLE CONSTANTS - Editorial Design                        */
  /* ========================================================= */

  const s = {
    // Root - Cream paper background with subtle border
    root: {
      backgroundColor: "#faf7f0",
      padding: "56px 48px",
      fontSize: "12px",
      color: "#1f1d1b",
      width: "100%",
      maxWidth: "210mm",
      minWidth: "100%",
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontWeight: "300",
      border: "1px solid #e4dccc",
      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
    },

    // Typography
    serifDisplay: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontWeight: "400",
    },
    tabularNums: {
      fontVariantNumeric: "tabular-nums",
    },

    // Header section with double border effect
    headerWrapper: {
      marginBottom: "40px",
    },
    headerTop: {
      borderTop: "2px solid #a89d8c",
      borderBottom: "1px solid #a89d8c",
      padding: "28px 0",
      marginBottom: "0",
    },
    headerMain: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    headerLeft: {
      flex: 1,
    },
    companyName: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "38px",
      fontWeight: "400",
      letterSpacing: "-0.01em",
      color: "#1f1d1b",
      margin: "0 0 10px 0",
      lineHeight: "1.1",
    },
    companyMeta: {
      fontSize: "10px",
      color: "#5c564e",
      lineHeight: "1.7",
      margin: 0,
      fontWeight: "300",
    },
    logoMonogram: {
      width: "64px",
      height: "64px",
      border: "1.5px solid #a07c3a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#ffffff",
      flexShrink: 0,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    },
    logoImg: {
      width: "100%",
      height: "100%",
      objectFit: "contain",
    },
    monogramFallback: {
      fontFamily: '"Georgia", serif',
      fontSize: "28px",
      color: "#a07c3a",
      fontWeight: "400",
    },

    // Invoice title section
    invoiceTitleSection: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: "48px",
      paddingBottom: "24px",
      borderBottom: "1px solid #a89d8c",
    },
    invoiceMetaGrid: {
      display: "grid",
      gridTemplateColumns: "auto auto",
      gap: "20px 40px",
    },
    metaLabel: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#5c564e",
      fontWeight: "500",
      marginBottom: "4px",
    },
    metaValue: {
      fontSize: "12px",
      color: "#1f1d1b",
      fontWeight: "400",
      fontVariantNumeric: "tabular-nums",
    },
    invoiceTitle: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "52px",
      fontWeight: "400",
      letterSpacing: "0.08em",
      color: "#1f1d1b",
      textAlign: "right",
      margin: 0,
      lineHeight: "1",
    },
    invoiceTypeBadge: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#a07c3a",
      marginLeft: "8px",
      fontWeight: "400",
    },

    // Client block - parchment style
    clientBlock: {
      backgroundColor: "#e4dccc",
      border: "1px solid #a89d8c",
      borderLeft: "3px solid #a07c3a",
      padding: "28px 32px",
      marginBottom: "48px",
      boxShadow: "inset 0 1px 2px rgba(255,255,255,0.8)",
    },
    clientGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px 48px",
    },
    clientLabel: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#5c564e",
      marginBottom: "6px",
      fontWeight: "500",
    },
    clientValue: {
      fontSize: "13px",
      color: "#1f1d1b",
      fontWeight: "400",
      lineHeight: "1.6",
    },
    clientLink: {
      color: "#5c564e",
      textDecoration: "none",
      borderBottom: "1px solid #a07c3a",
      paddingBottom: "2px",
    },

    // Pricing section
    pricingSection: {
      marginBottom: "48px",
    },
    pricingGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 2fr",
      border: "1px solid #a89d8c",
      backgroundColor: "#ffffff",
    },
    pricingCell: {
      padding: "20px 24px",
      borderRight: "1px solid #e4dccc",
    },
    pricingCellLast: {
      padding: "20px 24px",
    },
    pricingLabel: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      marginBottom: "8px",
      fontWeight: "500",
    },
    pricingValue: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "22px",
      color: "#1f1d1b",
      fontVariantNumeric: "tabular-nums",
    },
    pricingNote: {
      fontSize: "10px",
      color: "#5c564e",
      fontStyle: "italic",
      lineHeight: "1.6",
    },

    // Room section
    roomSection: {
      marginBottom: "40px",
      border: "1px solid #e4dccc",
      padding: "24px",
      backgroundColor: "#ffffff",
    },
    roomHeader: {
      marginBottom: "20px",
    },
    roomName: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "20px",
      fontWeight: "400",
      color: "#1f1d1b",
      margin: "0 0 12px 0",
    },
    roomDivider: {
      height: "1px",
      backgroundColor: "#a07c3a",
      marginBottom: "16px",
      background: "linear-gradient(90deg, #a07c3a 0%, #e4dccc 100%)",
    },
    roomMeta: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "20px",
    },
    roomDesc: {
      fontSize: "11px",
      color: "#5c564e",
      fontStyle: "italic",
    },
    roomRates: {
      display: "flex",
      gap: "28px",
      fontSize: "10px",
      color: "#5c564e",
      fontWeight: "400",
    },

    // Table styles with fixed layout
    tableWrapper: {
      border: "1px solid #e4dccc",
      marginBottom: "16px",
      overflow: "auto",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      tableLayout: "fixed",
    },
    tableHeader: {
      borderBottom: "1px solid #a89d8c",
      backgroundColor: "#faf7f0",
    },
    th: {
      padding: "14px 10px",
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      fontWeight: "500",
      textAlign: "left",
      borderBottom: "1px solid #a89d8c",
    },
    thCenter: {
      padding: "14px 10px",
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      fontWeight: "500",
      textAlign: "center",
      borderBottom: "1px solid #a89d8c",
    },
    thRight: {
      padding: "14px 10px",
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      fontWeight: "500",
      textAlign: "right",
      borderBottom: "1px solid #a89d8c",
    },
    td: {
      padding: "12px 10px",
      fontSize: "11px",
      color: "#1f1d1b",
      fontWeight: "300",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid #f0ebe0",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    tdCenter: {
      padding: "12px 10px",
      fontSize: "11px",
      color: "#1f1d1b",
      fontWeight: "300",
      textAlign: "center",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid #f0ebe0",
    },
    tdRight: {
      padding: "12px 10px",
      fontSize: "11px",
      color: "#1f1d1b",
      fontWeight: "300",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid #f0ebe0",
    },
    tdBold: {
      padding: "12px 10px",
      fontSize: "11px",
      color: "#1f1d1b",
      fontWeight: "600",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      borderBottom: "1px solid #f0ebe0",
    },
    rowEven: {
      backgroundColor: "#ffffff",
    },
    rowOdd: {
      backgroundColor: "#faf7f0",
    },

    // Room total row
    roomTotalWrapper: {
      marginTop: "8px",
    },
    roomTotalTable: {
      width: "100%",
      borderCollapse: "collapse",
      border: "1px solid #e4dccc",
    },
    roomTotalRow: {
      backgroundColor: "#faf7f0",
    },
    roomTotalLabel: {
      padding: "14px 16px",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      fontWeight: "500",
      border: "1px solid #e4dccc",
    },
    roomTotalValue: {
      padding: "14px 16px",
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "16px",
      color: "#1f1d1b",
      textAlign: "right",
      fontWeight: "400",
      border: "1px solid #e4dccc",
      fontVariantNumeric: "tabular-nums",
    },

    // Extras section
    extrasSection: {
      marginBottom: "40px",
      border: "1px solid #e4dccc",
      padding: "24px",
      backgroundColor: "#ffffff",
    },
    extrasHeader: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "20px",
      fontWeight: "400",
      color: "#1f1d1b",
      margin: "0 0 24px 0",
      paddingBottom: "16px",
      borderBottom: "1px solid #a07c3a",
    },
    extrasTotalRow: {
      backgroundColor: "#faf7f0",
    },
    extrasTotalLabel: {
      padding: "14px 16px",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      fontWeight: "500",
      border: "1px solid #e4dccc",
    },
    extrasTotalValue: {
      padding: "14px 16px",
      fontSize: "14px",
      color: "#1f1d1b",
      textAlign: "right",
      fontWeight: "600",
      border: "1px solid #e4dccc",
      fontVariantNumeric: "tabular-nums",
    },

    // Grand total section
    summarySection: {
      marginBottom: "40px",
      border: "1px solid #e4dccc",
      padding: "24px",
      backgroundColor: "#ffffff",
    },
    summaryHeader: {
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "20px",
      fontWeight: "400",
      color: "#1f1d1b",
      margin: "0 0 24px 0",
      paddingBottom: "16px",
      borderBottom: "1px solid #a07c3a",
    },
    summaryTable: {
      width: "100%",
      maxWidth: "420px",
      marginLeft: "auto",
      borderCollapse: "collapse",
    },
    summaryLabel: {
      padding: "10px 0",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      textAlign: "right",
      fontWeight: "500",
      width: "60%",
    },
    summaryValue: {
      padding: "10px 0 10px 36px",
      fontSize: "13px",
      color: "#1f1d1b",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "400",
      width: "40%",
    },
    discountLabel: {
      padding: "10px 0",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#8b2518",
      textAlign: "right",
      fontWeight: "500",
      width: "60%",
    },
    discountValue: {
      padding: "10px 0 10px 36px",
      fontSize: "13px",
      color: "#8b2518",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "500",
      width: "40%",
    },
    finalPayableRow: {
      borderTop: "1px solid #a89d8c",
    },
    finalPayableLabel: {
      padding: "18px 0 12px 0",
      fontSize: "11px",
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "#5c564e",
      textAlign: "right",
      fontWeight: "600",
      width: "60%",
    },
    finalPayableValue: {
      padding: "18px 0 12px 36px",
      fontFamily: '"Georgia", "Cormorant Garamond", serif',
      fontSize: "24px",
      color: "#1f1d1b",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
      fontWeight: "400",
      borderBottom: "2px solid #a07c3a",
      width: "40%",
    },

    // Footer
    footer: {
      marginTop: "48px",
      paddingTop: "28px",
      borderTop: "1px solid #a89d8c",
    },
    footerGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "40px",
    },
    footerLabel: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.12em",
      color: "#a07c3a",
      marginBottom: "12px",
      fontWeight: "600",
    },
    footerText: {
      fontSize: "10px",
      color: "#5c564e",
      margin: "0 0 4px 0",
      lineHeight: "1.6",
    },
    termsList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },
    termsItem: {
      fontSize: "10px",
      color: "#5c564e",
      marginBottom: "6px",
      display: "flex",
      gap: "12px",
      lineHeight: "1.5",
    },
    termsNumber: {
      color: "#a07c3a",
      flexShrink: 0,
      fontWeight: "600",
      minWidth: "20px",
    },
    footerThanks: {
      marginTop: "32px",
      paddingTop: "20px",
      textAlign: "center",
      borderTop: "0.5px solid #a89d8c",
    },
    footerThanksText: {
      fontSize: "9px",
      textTransform: "uppercase",
      letterSpacing: "0.15em",
      color: "#a07c3a",
      fontWeight: "500",
    },
  };

  /* ========================================================= */
  /* RENDER                                                    */
  /* ========================================================= */

  return (
    <div ref={ref} style={s.root}>
      {/* Header */}
      <div style={s.headerWrapper}>
        <div style={s.headerTop}>
          <div style={s.headerMain}>
            <div style={s.headerLeft}>
              <h1 style={s.companyName}>{company?.name}</h1>
              <p style={s.companyMeta}>
                {company?.registeredOffice}
                {company?.industryAddress && (
                  <>
                    <br />
                    {company.industryAddress}
                  </>
                )}
              </p>
              <p style={s.companyMeta}>
                {company?.phones.join(" · ")} · {company?.email}
                {company?.website && <> · {company.website}</>}
              </p>
            </div>
            <div style={s.logoMonogram}>
              {logoURL ? (
                <img
                  src={logoURL}
                  alt=""
                  style={s.logoImg}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span style={s.monogramFallback}>
                  {company?.name?.charAt(0) || "A"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Title */}
      <div style={s.invoiceTitleSection}>
        <div style={s.invoiceMetaGrid}>
          <div>
            <div style={s.metaLabel}>INVOICE NO.</div>
            <div style={s.metaValue}>
              {invoiceIdShort || "—"}
              {invoice.invoiceType && (
                <span style={s.invoiceTypeBadge}>({invoice.invoiceType})</span>
              )}
            </div>
          </div>
          <div>
            <div style={s.metaLabel}>DATE</div>
            <div style={s.metaValue}>{invoiceDate || "—"}</div>
          </div>
        </div>
        <h2 style={s.invoiceTitle}>INVOICE</h2>
      </div>

      {/* Client Details */}
      <div style={s.clientBlock}>
        <div style={s.clientGrid}>
          <div>
            <div style={s.clientLabel}>CLIENT</div>
            <div style={s.clientValue}>{client.name || "—"}</div>
          </div>
          <div>
            <div style={s.clientLabel}>MOBILE</div>
            <div style={s.clientValue}>{client.mobile || "—"}</div>
          </div>
          <div>
            <div style={s.clientLabel}>EMAIL</div>
            <div style={s.clientValue}>{client.email || "—"}</div>
          </div>
          <div>
            <div style={s.clientLabel}>SITE ADDRESS</div>
            <div style={s.clientValue}>{client.siteAddress || "—"}</div>
          </div>
          {client.siteMapLink && (
            <div style={{ gridColumn: "span 2" }}>
              <div style={s.clientLabel}>LOCATION</div>
              <a
                href={client.siteMapLink}
                target="_blank"
                rel="noreferrer"
                style={s.clientLink}
              >
                {client.siteMapLink.length > 50
                  ? client.siteMapLink.substring(0, 50) + "..."
                  : client.siteMapLink}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Pricing Summary */}
      <div style={s.pricingSection}>
        <div style={s.pricingGrid}>
          <div style={s.pricingCell}>
            <div style={s.pricingLabel}>FRAME RATE (per sqft)</div>
            <div style={s.pricingValue}>
              {frameworkRate ? formatINR(frameworkRate) : "—"}
            </div>
          </div>
          <div style={s.pricingCell}>
            <div style={s.pricingLabel}>BOX RATE (per sqft)</div>
            <div style={s.pricingValue}>
              {boxRate
                ? formatINR(boxRate)
                : frameworkRate
                  ? formatINR(frameworkRate * 1.4)
                  : "—"}
            </div>
          </div>
          <div style={s.pricingCellLast}>
            <div style={s.pricingLabel}>NOTE</div>
            <div style={s.pricingNote}>
              Room-specific prices may vary based on requirements.
            </div>
          </div>
        </div>
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
          <div key={roomIndex} style={s.roomSection}>
            <div style={s.roomHeader}>
              <h3 style={s.roomName}>{room.name || `Room ${roomIndex + 1}`}</h3>
              <div style={s.roomDivider} />
              <div style={s.roomMeta}>
                {room.description && (
                  <span style={s.roomDesc}>{room.description}</span>
                )}
                <div style={s.roomRates}>
                  <span>Frame: {formatINR(roomFrameRate)}/sqft</span>
                  <span>Box: {formatINR(roomBoxRate)}/sqft</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {(room.items || []).length > 0 && (
              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <colgroup>
                    <col style={{ width: "35%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "20%" }} />
                  </colgroup>
                  <thead>
                    <tr style={s.tableHeader}>
                      <th style={s.th}>ITEM</th>
                      <th style={s.thCenter}>TYPE</th>
                      <th style={s.thRight}>AREA (sqft)</th>
                      <th style={s.thRight}>RATE</th>
                      <th style={s.thRight}>TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(room.items || []).map((item, itemIndex) => {
                      const hasFrame = item.frame && item.frame.area > 0;
                      const hasBox = item.box && item.box.area > 0;
                      const itemTotal = calculateItemTotal(item);
                      const rowSpan = hasFrame && hasBox ? 2 : 1;
                      const rowStyle =
                        itemIndex % 2 === 0 ? s.rowEven : s.rowOdd;

                      return (
                        <React.Fragment key={itemIndex}>
                          {hasFrame && (
                            <tr style={rowStyle}>
                              {rowSpan > 1 ? (
                                <td
                                  rowSpan={rowSpan}
                                  style={{ ...s.td, fontWeight: "500" }}
                                >
                                  {item.name}
                                </td>
                              ) : (
                                <td style={{ ...s.td, fontWeight: "500" }}>
                                  {item.name}
                                </td>
                              )}
                              <td style={s.tdCenter}>Frame</td>
                              <td style={s.tdRight}>
                                {item.frame.area.toFixed(2)}
                              </td>
                              <td style={s.tdRight}>
                                {formatINR(item.frame.price)}
                              </td>
                              {rowSpan > 1 ? (
                                <td rowSpan={rowSpan} style={s.tdBold}>
                                  {formatINR(itemTotal)}
                                </td>
                              ) : (
                                <td style={s.tdBold}>{formatINR(itemTotal)}</td>
                              )}
                            </tr>
                          )}
                          {hasBox && (
                            <tr style={rowStyle}>
                              {!hasFrame && (
                                <td style={{ ...s.td, fontWeight: "500" }}>
                                  {item.name}
                                </td>
                              )}
                              <td style={s.tdCenter}>Box</td>
                              <td style={s.tdRight}>
                                {item.box.area.toFixed(2)}
                              </td>
                              <td style={s.tdRight}>
                                {formatINR(item.box.price)}
                              </td>
                              {!hasFrame && (
                                <td style={s.tdBold}>{formatINR(itemTotal)}</td>
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

            {/* Accessories Table */}
            {room.accessories?.length > 0 && (
              <div style={s.tableWrapper}>
                <table style={s.table}>
                  <colgroup>
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "20%" }} />
                    <col style={{ width: "15%" }} />
                    <col style={{ width: "25%" }} />
                  </colgroup>
                  <thead>
                    <tr style={s.tableHeader}>
                      <th style={s.th} colSpan={4}>
                        ACCESSORIES
                      </th>
                    </tr>
                    <tr style={s.tableHeader}>
                      <th style={s.th}>NAME</th>
                      <th style={s.thRight}>UNIT PRICE</th>
                      <th style={s.thCenter}>QTY</th>
                      <th style={s.thRight}>TOTAL</th>
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
                          <td style={s.td}>{acc.name}</td>
                          <td style={s.tdRight}>{formatINR(acc.price)}</td>
                          <td style={s.tdCenter}>{acc.qty}</td>
                          <td style={s.tdBold}>{formatINR(total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Room Total */}
            <div style={s.roomTotalWrapper}>
              <table style={s.roomTotalTable}>
                <tbody>
                  <tr style={s.roomTotalRow}>
                    <td style={s.roomTotalLabel} colSpan="3">
                      Room Total (Items + Accessories)
                    </td>
                    <td style={s.roomTotalValue}>
                      {formatINR(roomTotal || 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Extras */}
      {extras.length > 0 && (
        <div style={s.extrasSection}>
          <h3 style={s.extrasHeader}>Additional Services</h3>
          <div style={s.tableWrapper}>
            <table style={s.table}>
              <colgroup>
                <col style={{ width: "40%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "20%" }} />
              </colgroup>
              <thead>
                <tr style={s.tableHeader}>
                  <th style={s.th}>DESCRIPTION</th>
                  <th style={s.thRight}>QUANTITY/AREA</th>
                  <th style={s.thRight}>RATE</th>
                  <th style={s.thRight}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((ex, idx) => {
                  const inputs = safeInputs(ex.inputs || {});
                  const key = ex._id || ex.id || ex.key;

                  return (
                    <tr key={key} style={idx % 2 === 0 ? s.rowEven : s.rowOdd}>
                      <td style={s.td}>{ex.label}</td>
                      <td style={s.tdRight}>
                        {ex.type === "ceiling"
                          ? inputs.surfaces?.length || 1
                          : ex.type === "area_based"
                            ? `${inputs.area} sq.ft`
                            : "Fixed"}
                      </td>
                      <td style={s.tdRight}>
                        {ex.type === "ceiling"
                          ? "As per design"
                          : ex.type === "area_based"
                            ? formatINR(inputs.unitPrice)
                            : formatINR(inputs.price)}
                      </td>
                      <td style={s.tdBold}>{formatINR(ex.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <table style={{ ...s.roomTotalTable, marginTop: "16px" }}>
            <tbody>
              <tr style={s.extrasTotalRow}>
                <td style={s.extrasTotalLabel} colSpan="3">
                  Extras Total
                </td>
                <td style={s.extrasTotalValue}>{formatINR(extrasTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div style={s.summarySection}>
        <h3 style={s.summaryHeader}>Summary</h3>
        <table style={s.summaryTable}>
          <colgroup>
            <col style={{ width: "60%" }} />
            <col style={{ width: "40%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td style={s.summaryLabel}>Total Room Work</td>
              <td style={s.summaryValue}>{formatINR(roomsTotal)}</td>
            </tr>
            {extrasTotal > 0 && (
              <tr>
                <td style={s.summaryLabel}>Additional Services</td>
                <td style={s.summaryValue}>+ {formatINR(extrasTotal)}</td>
              </tr>
            )}
            <tr>
              <td style={s.summaryLabel}>Subtotal</td>
              <td style={s.summaryValue}>{formatINR(grandTotal)}</td>
            </tr>
            {safeDiscount > 0 && (
              <tr>
                <td style={s.discountLabel}>Discount</td>
                <td style={s.discountValue}>− {formatINR(safeDiscount)}</td>
              </tr>
            )}
            <tr style={s.finalPayableRow}>
              <td style={s.finalPayableLabel}>Final Amount</td>
              <td style={s.finalPayableValue}>{formatINR(finalPayable)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerLabel}>Contact Details</div>
            <p style={s.footerText}>{company?.phones.join(" · ")}</p>
            <p style={s.footerText}>{company?.email}</p>
            {company?.website && <p style={s.footerText}>{company.website}</p>}
          </div>
          {(company?.termsAndConditions ?? []).length > 0 && (
            <div>
              <div style={s.footerLabel}>Terms &amp; Conditions</div>
              <ul style={s.termsList}>
                {company.termsAndConditions.map((term, i) => (
                  <li key={i} style={s.termsItem}>
                    <span style={s.termsNumber}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div style={s.footerThanks}>
          <span style={s.footerThanksText}>
            Thank you for considering {company?.name}. We look forward to
            serving you.
          </span>
        </div>
      </div>
    </div>
  );
});

export default ClientInvoiceT1;
