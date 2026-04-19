import { useState, useEffect } from "react";
import api from "../api/api";
import { forwardRef } from "react";
import config from "../config.js";

/* -------------------------------
   CompareInvoicesT3 Component
--------------------------------*/

const CompareInvoicesT3 = forwardRef(
  ({ invoiceAId, invoiceBId, onLoadedA, onLoadedB, company }, ref) => {
    const [invoiceA, setInvoiceA] = useState(null);
    const [invoiceB, setInvoiceB] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
      async function fetchInvoices() {
        if (!invoiceAId || !invoiceBId) return;

        try {
          setLoading(true);
          setError(null);
          const res = await api.post("/invoices/compare", {
            invoiceAId,
            invoiceBId,
          });
          setInvoiceA(res.data.data.invoiceA);
          setInvoiceB(res.data.data.invoiceB);
          onLoadedA?.(res.data.data.invoiceA);
          onLoadedB?.(res.data.data.invoiceB);
        } catch (err) {
          console.error("Failed to load invoices", err);
          setError("Failed to load invoices. Please try again.");
          setInvoiceA(null);
          setInvoiceB(null);
        } finally {
          setLoading(false);
        }
      }
      fetchInvoices();
    }, [invoiceAId, invoiceBId, onLoadedA, onLoadedB]);

    if (loading) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            backgroundColor: "#FAF9F7",
          }}
        >
          <div
            style={{
              display: "inline-block",
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              height: "40px",
              width: "40px",
              border: "3px solid #E2DDD5",
              borderTopColor: "#D4A853",
            }}
          ></div>
          <p style={{ marginTop: "16px", color: "#7A8A82", fontSize: "14px" }}>
            Loading comparison report...
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            backgroundColor: "#FAF9F7",
            color: "#C77D4B",
          }}
        >
          <p style={{ fontSize: "14px" }}>{error}</p>
        </div>
      );
    }

    if (!invoiceA || !invoiceB) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            backgroundColor: "#FAF9F7",
            color: "#7A8A82",
          }}
        >
          <p style={{ fontSize: "14px" }}>
            Please select two invoices to compare
          </p>
        </div>
      );
    }

    return (
      <InvoiceComparisonReport
        ref={ref}
        invoiceA={invoiceA}
        invoiceB={invoiceB}
        company={company}
      />
    );
  },
);

/* -------------------------------
   Invoice Comparison Report Component — Light & Elegant
--------------------------------*/

function InvoiceComparisonReport({ invoiceA, invoiceB, company }, ref) {
  const clientA = invoiceA.client || {};
  const clientB = invoiceB.client || {};

  const roomsA = Array.isArray(invoiceA.rooms) ? invoiceA.rooms : [];
  const roomsB = Array.isArray(invoiceB.rooms) ? invoiceB.rooms : [];

  const extrasA = Array.isArray(invoiceA.extras) ? invoiceA.extras : [];
  const extrasB = Array.isArray(invoiceB.extras) ? invoiceB.extras : [];

  const pricingA = invoiceA.pricing || {};
  const pricingB = invoiceB.pricing || {};

  const frameworkRateA =
    typeof pricingA.frameRate === "number" ? pricingA.frameRate : 0;
  const boxRateA =
    typeof pricingA.boxRate === "number"
      ? pricingA.boxRate
      : frameworkRateA * 1.4;

  const frameworkRateB =
    typeof pricingB.frameRate === "number" ? pricingB.frameRate : 0;
  const boxRateB =
    typeof pricingB.boxRate === "number"
      ? pricingB.boxRate
      : frameworkRateB * 1.4;

  const roomsTotalsA = roomsA.map((room) =>
    calcRoomAggregates(room, frameworkRateA, boxRateA),
  );
  const roomsTotalsB = roomsB.map((room) =>
    calcRoomAggregates(room, frameworkRateB, boxRateB),
  );

  const roomsTotalA = roomsTotalsA.reduce((sum, r) => sum + r.roomTotal, 0);
  const roomsTotalB = roomsTotalsB.reduce((sum, r) => sum + r.roomTotal, 0);

  const extrasTotalA = calcExtrasTotal(extrasA);
  const extrasTotalB = calcExtrasTotal(extrasB);

  const grandTotalA =
    typeof invoiceA.grandTotal === "number"
      ? invoiceA.grandTotal
      : roomsTotalA + extrasTotalA;
  const grandTotalB =
    typeof invoiceB.grandTotal === "number"
      ? invoiceB.grandTotal
      : roomsTotalB + extrasTotalB;

  const discountA = Number(invoiceA.discount || 0);
  const discountB = Number(invoiceB.discount || 0);

  const finalPayableA = Number(
    invoiceA.finalPayable || grandTotalA - Math.min(discountA, grandTotalA),
  );
  const finalPayableB = Number(
    invoiceB.finalPayable || grandTotalB - Math.min(discountB, grandTotalB),
  );

  const invoiceDateA = invoiceA.createdAt
    ? new Date(invoiceA.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";
  const invoiceDateB = invoiceB.createdAt
    ? new Date(invoiceB.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  const invoiceIdShortA = invoiceA._id
    ? `INV-${String(invoiceA._id).slice(-6).toUpperCase()}`
    : "";
  const invoiceIdShortB = invoiceB._id
    ? `INV-${String(invoiceB._id).slice(-6).toUpperCase()}`
    : "";

  const totalDifference = getDifference(finalPayableA, finalPayableB);
  const extrasDifference = getDifference(extrasTotalA, extrasTotalB);
  const percentageDifference = (
    (Math.abs(totalDifference) / Math.max(finalPayableA, finalPayableB)) *
    100
  ).toFixed(1);

  const pageWidth = "210mm";
  // const contentWidth = "190mm";

  /* ========================================================= */
  /* LIGHT & ELEGANT COLOR PALETTE                             */
  /* ========================================================= */
  const colors = {
    primary: "#4A6B5D",
    secondary: "#7FA392",
    accent: "#D4A853",
    accentLight: "#E8D5B0",
    background: "#FAF9F7",
    surface: "#F5F3EF",
    surfaceLight: "#FDFCFA",
    textPrimary: "#3A4A42",
    textSecondary: "#7A8A82",
    border: "#E2DDD5",
    borderLight: "#EFEBE5",
    success: "#5B8A74",
    warning: "#C77D4B",
    headerBg: "#F0EDE6",
    diffPositive: "#5B8A74",
    diffNegative: "#C77D4B",
    diffNeutral: "#7A8A82",
  };

  /* ========================================================= */
  /* STYLE CONSTANTS                                           */
  /* ========================================================= */

  const s = {
    page: {
      backgroundColor: colors.background,
      color: colors.textPrimary,
      fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      fontSize: "13px",
      lineHeight: "1.5",
      width: pageWidth,
      margin: "0 auto",
      position: "relative",
    },

    borderFrame: {
      position: "absolute",
      top: "12px",
      left: "12px",
      right: "12px",
      bottom: "12px",
      border: `1px solid ${colors.accentLight}`,
      pointerEvents: "none",
    },

    content: {
      padding: "24px 28px",
      position: "relative",
    },

    // Header
    header: {
      marginBottom: "28px",
    },

    headerTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: "16px",
    },

    companySection: {
      flex: 1,
    },

    companyName: {
      fontSize: "24px",
      fontWeight: "600",
      color: colors.primary,
      margin: "0 0 6px 0",
      letterSpacing: "-0.02em",
    },

    companyDetails: {
      fontSize: "10px",
      color: colors.textSecondary,
      lineHeight: "1.5",
      margin: "2px 0",
    },

    logoWrapper: {
      width: "56px",
      height: "56px",
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
      padding: "6px",
    },

    logoPlaceholder: {
      width: "56px",
      height: "56px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "22px",
      fontWeight: "600",
      color: colors.primary,
      backgroundColor: colors.surface,
      borderRadius: "8px",
      border: `1px solid ${colors.border}`,
    },

    titleSection: {
      borderBottom: `1px solid ${colors.accent}`,
      paddingBottom: "12px",
    },

    reportTitle: {
      fontSize: "18px",
      fontWeight: "600",
      color: colors.primary,
      margin: "0 0 4px 0",
      letterSpacing: "-0.01em",
    },

    reportSubtitle: {
      fontSize: "12px",
      color: colors.textSecondary,
      margin: 0,
    },

    // Comparison Header
    comparisonHeader: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      padding: "20px 24px",
      marginBottom: "24px",
      border: `1px solid ${colors.borderLight}`,
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },

    comparisonTitle: {
      fontSize: "15px",
      fontWeight: "600",
      color: colors.primary,
    },

    totalDiffBox: {
      textAlign: "right",
      padding: "12px 20px",
      backgroundColor: colors.surface,
      borderRadius: "8px",
      border: `1px solid ${colors.accentLight}`,
    },

    totalDiffLabel: {
      fontSize: "11px",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      marginBottom: "4px",
    },

    totalDiffValue: {
      fontSize: "22px",
      fontWeight: "700",
    },

    // Section Headers
    sectionHeader: {
      fontSize: "14px",
      fontWeight: "600",
      color: colors.primary,
      marginBottom: "16px",
      marginTop: "24px",
      display: "flex",
      alignItems: "center",
    },

    sectionHeaderAccent: {
      width: "3px",
      height: "16px",
      backgroundColor: colors.accent,
      marginRight: "10px",
      borderRadius: "2px",
    },

    sectionDivider: {
      width: "100%",
      height: "1px",
      backgroundColor: colors.borderLight,
      margin: "20px 0",
    },

    // Invoice Detail Cards
    detailGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "24px",
    },

    detailCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      padding: "18px 20px",
      border: `1px solid ${colors.borderLight}`,
    },

    detailHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "14px",
      paddingBottom: "10px",
      borderBottom: `1px solid ${colors.borderLight}`,
    },

    detailTitle: {
      fontWeight: "600",
      color: colors.primary,
      fontSize: "14px",
    },

    detailBadge: {
      fontSize: "10px",
      backgroundColor: colors.accentLight,
      color: colors.primary,
      padding: "3px 10px",
      borderRadius: "20px",
      fontWeight: "500",
      letterSpacing: "0.03em",
    },

    detailTable: {
      width: "100%",
      fontSize: "12px",
    },

    detailRow: {
      display: "flex",
      justifyContent: "space-between",
      padding: "5px 0",
    },

    detailLabel: {
      color: colors.textSecondary,
    },

    detailValue: {
      fontWeight: "500",
      color: colors.textPrimary,
    },

    detailTotal: {
      display: "flex",
      justifyContent: "space-between",
      padding: "10px 0 0",
      marginTop: "8px",
      borderTop: `1px solid ${colors.borderLight}`,
      fontWeight: "600",
    },

    // Quick Comparison Cards
    quickComparisonGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr 1fr",
      gap: "16px",
      marginBottom: "8px",
    },

    statCard: {
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      padding: "16px",
      border: `1px solid ${colors.borderLight}`,
    },

    statCardHighlight: {
      backgroundColor: colors.surface,
      borderRadius: "10px",
      padding: "16px",
      border: `1px solid ${colors.accentLight}`,
    },

    statLabel: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "8px",
      letterSpacing: "0.03em",
      textTransform: "uppercase",
    },

    statDiff: {
      fontSize: "20px",
      fontWeight: "700",
      marginBottom: "8px",
    },

    statValues: {
      fontSize: "11px",
      color: colors.textSecondary,
    },

    comparisonMeta: {
      marginTop: "16px",
      paddingTop: "14px",
      borderTop: `1px solid ${colors.borderLight}`,
      fontSize: "12px",
      color: colors.textSecondary,
    },

    // Table Styles
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "12px",
      backgroundColor: colors.surfaceLight,
      borderRadius: "8px",
      overflow: "hidden",
      border: `1px solid ${colors.borderLight}`,
    },

    tableHeader: {
      backgroundColor: colors.headerBg,
      borderBottom: `1px solid ${colors.border}`,
    },

    th: {
      padding: "12px 12px",
      textAlign: "left",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    thRight: {
      padding: "12px 12px",
      textAlign: "right",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    thCenter: {
      padding: "12px 12px",
      textAlign: "center",
      fontSize: "11px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    td: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.borderLight}`,
    },

    tdRight: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.borderLight}`,
      textAlign: "right",
      fontVariantNumeric: "tabular-nums",
    },

    tdCenter: {
      padding: "10px 12px",
      borderBottom: `1px solid ${colors.borderLight}`,
      textAlign: "center",
    },

    // Room Card
    roomCard: {
      marginBottom: "20px",
      backgroundColor: colors.surfaceLight,
      borderRadius: "10px",
      overflow: "hidden",
      border: `1px solid ${colors.borderLight}`,
    },

    roomHeader: {
      backgroundColor: colors.headerBg,
      padding: "14px 18px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottom: `1px solid ${colors.borderLight}`,
    },

    roomHeaderLeft: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
    },

    roomIndex: {
      fontSize: "13px",
      fontWeight: "600",
      color: colors.primary,
    },

    roomName: {
      fontSize: "14px",
      fontWeight: "500",
      color: colors.textPrimary,
    },

    roomDesc: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginLeft: "8px",
    },

    roomDiff: {
      textAlign: "right",
    },

    roomDiffLabel: {
      fontSize: "10px",
      color: colors.textSecondary,
    },

    roomDiffValue: {
      fontSize: "14px",
      fontWeight: "600",
    },

    roomTable: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "11px",
    },

    roomTableHeader: {
      backgroundColor: colors.surface,
      borderBottom: `1px solid ${colors.border}`,
    },

    roomTh: {
      padding: "10px 8px",
      fontSize: "10px",
      fontWeight: "600",
      color: colors.textSecondary,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
    },

    roomTd: {
      padding: "8px",
      borderBottom: `1px solid ${colors.borderLight}`,
    },

    roomTotalRow: {
      backgroundColor: colors.surface,
      fontWeight: "600",
    },

    // Extras Summary
    extrasSummary: {
      backgroundColor: colors.surface,
      borderRadius: "8px",
      padding: "16px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "16px",
      border: `1px solid ${colors.borderLight}`,
    },

    // Footer
    footer: {
      marginTop: "32px",
      paddingTop: "20px",
      borderTop: `1px solid ${colors.borderLight}`,
    },

    footerGrid: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
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

    footerNotes: {
      textAlign: "right",
    },

    footerNoteList: {
      listStyle: "none",
      padding: 0,
      margin: 0,
    },

    footerNoteItem: {
      fontSize: "11px",
      color: colors.textSecondary,
      marginBottom: "4px",
    },

    footerBottom: {
      marginTop: "20px",
      paddingTop: "16px",
      borderTop: `1px solid ${colors.borderLight}`,
      textAlign: "center",
      fontSize: "10px",
      color: colors.textSecondary,
    },
  };

  const logoURL = `${import.meta.env.VITE_API_BASE}/public/${(company ?? config.platform).logoFile}`;

  return (
    <div ref={ref} style={s.page}>
      <div style={s.borderFrame} />

      <div style={s.content}>
        {/* Header */}
        <div style={s.header}>
          <div style={s.headerTop}>
            <div style={s.companySection}>
              <h1 style={s.companyName}>{(company ?? config.platform).name}</h1>
              <p style={s.companyDetails}>
                {(company ?? config.platform).registeredOffice}
              </p>
              <p style={s.companyDetails}>
                {(company ?? config.platform).industryAddress}
              </p>
              <p style={s.companyDetails}>
                {(company ?? config.platform).phones.join(" · ")} ·{" "}
                {(company ?? config.platform).email}
              </p>
            </div>
            <div style={s.logoWrapper}>
              <img
                src={logoURL}
                alt="Logo"
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `<div style="width:56px;height:56px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:600;color:#4A6B5D;background:#F5F3EF;border-radius:8px;">${(company ?? config.platform).name?.[0] || "C"}</div>`;
                }}
              />
            </div>
          </div>
          <div style={s.titleSection}>
            <h2 style={s.reportTitle}>Invoice Comparison Report</h2>
            <p style={s.reportSubtitle}>
              Detailed comparison between two invoices
            </p>
          </div>
        </div>

        {/* Comparison Header */}
        <div style={s.comparisonHeader}>
          <span style={s.comparisonTitle}>Total Difference</span>
          <div style={s.totalDiffBox}>
            <div style={s.totalDiffLabel}>Invoice A - Invoice B</div>
            <div
              style={{
                ...s.totalDiffValue,
                color:
                  totalDifference > 0
                    ? colors.diffPositive
                    : totalDifference < 0
                      ? colors.diffNegative
                      : colors.textSecondary,
              }}
            >
              {totalDifference > 0 ? "+" : ""}
              {formatINR(Math.abs(totalDifference))}
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div style={s.sectionHeader}>
          <div style={s.sectionHeaderAccent} />
          Invoice Details
        </div>
        <div style={s.detailGrid}>
          {/* Invoice A Card */}
          <div style={s.detailCard}>
            <div style={s.detailHeader}>
              <span style={s.detailTitle}>Invoice A</span>
              <span style={s.detailBadge}>
                {invoiceA.invoiceType || "Proforma"}
              </span>
            </div>
            <div style={s.detailTable}>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Invoice No</span>
                <span style={s.detailValue}>{invoiceIdShortA}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Date</span>
                <span style={s.detailValue}>{invoiceDateA}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Client</span>
                <span style={s.detailValue}>{clientA.name}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Mobile</span>
                <span style={s.detailValue}>{clientA.mobile}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Site Address</span>
                <span style={s.detailValue}>{clientA.siteAddress}</span>
              </div>
              <div style={s.detailTotal}>
                <span>Total Amount</span>
                <span>{formatINR(finalPayableA)}</span>
              </div>
            </div>
          </div>
          {/* Invoice B Card */}
          <div style={s.detailCard}>
            <div style={s.detailHeader}>
              <span style={s.detailTitle}>Invoice B</span>
              <span style={s.detailBadge}>
                {invoiceB.invoiceType || "Proforma"}
              </span>
            </div>
            <div style={s.detailTable}>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Invoice No</span>
                <span style={s.detailValue}>{invoiceIdShortB}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Date</span>
                <span style={s.detailValue}>{invoiceDateB}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Client</span>
                <span style={s.detailValue}>{clientB.name}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Mobile</span>
                <span style={s.detailValue}>{clientB.mobile}</span>
              </div>
              <div style={s.detailRow}>
                <span style={s.detailLabel}>Site Address</span>
                <span style={s.detailValue}>{clientB.siteAddress}</span>
              </div>
              <div style={s.detailTotal}>
                <span>Total Amount</span>
                <span>{formatINR(finalPayableB)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Comparison */}
        <div style={s.sectionHeader}>
          <div style={s.sectionHeaderAccent} />
          Quick Comparison
        </div>
        <div style={s.quickComparisonGrid}>
          <QuickStatCard
            label="Rooms Difference"
            valueA={roomsTotalA}
            valueB={roomsTotalB}
            colors={colors}
          />
          <QuickStatCard
            label="Extras Difference"
            valueA={extrasTotalA}
            valueB={extrasTotalB}
            colors={colors}
          />
          <QuickStatCard
            label="Discount Difference"
            valueA={discountA}
            valueB={discountB}
            colors={colors}
          />
          <QuickStatCard
            label="Total Difference"
            valueA={finalPayableA}
            valueB={finalPayableB}
            colors={colors}
            highlight
          />
        </div>
        <div style={s.comparisonMeta}>
          Percentage Difference: <strong>{percentageDifference}%</strong> ·
          {roomsA.length} rooms vs {roomsB.length} rooms ·{extrasA.length}{" "}
          extras vs {extrasB.length} extras
        </div>

        {/* Pricing Comparison */}
        <div style={s.sectionHeader}>
          <div style={s.sectionHeaderAccent} />
          Pricing Comparison
        </div>
        <table style={s.table}>
          <thead>
            <tr style={s.tableHeader}>
              <th style={s.th}>Rate Type</th>
              <th style={s.thRight}>{clientA.name}</th>
              <th style={s.thRight}>{clientB.name}</th>
              <th style={s.thRight}>Difference</th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Frame Work Rate (per sqft)"
              valueA={frameworkRateA}
              valueB={frameworkRateB}
              colors={colors}
            />
            <ComparisonRow
              label="Box Work Rate (per sqft)"
              valueA={boxRateA}
              valueB={boxRateB}
              colors={colors}
            />
          </tbody>
        </table>

        {/* Roomwise Comparison */}
        {(roomsA.length > 0 || roomsB.length > 0) && (
          <>
            <div style={s.sectionHeader}>
              <div style={s.sectionHeaderAccent} />
              Room Wise Comparison
            </div>
            <div
              style={{
                marginBottom: "8px",
                fontSize: "12px",
                color: colors.textSecondary,
              }}
            >
              {roomsA.length} rooms vs {roomsB.length} rooms
            </div>

            {(() => {
              const maxRooms = Math.max(roomsA.length, roomsB.length);
              return Array.from({ length: maxRooms }).map((_, idx) => {
                const roomA = roomsA[idx] || {};
                const roomB = roomsB[idx] || {};
                const aggA =
                  roomsTotalsA[idx] ||
                  calcRoomAggregates({}, frameworkRateA, boxRateA);
                const aggB =
                  roomsTotalsB[idx] ||
                  calcRoomAggregates({}, frameworkRateB, boxRateB);
                const roomDifference = getDifference(
                  aggA.roomTotal,
                  aggB.roomTotal,
                );

                const roomFrameRateA =
                  typeof roomA.frameRate === "number"
                    ? roomA.frameRate
                    : frameworkRateA;
                const roomBoxRateA =
                  typeof roomA.boxRate === "number" ? roomA.boxRate : boxRateA;
                const roomFrameRateB =
                  typeof roomB.frameRate === "number"
                    ? roomB.frameRate
                    : frameworkRateB;
                const roomBoxRateB =
                  typeof roomB.boxRate === "number" ? roomB.boxRate : boxRateB;

                return (
                  <div key={idx} style={s.roomCard}>
                    <div style={s.roomHeader}>
                      <div style={s.roomHeaderLeft}>
                        <span style={s.roomIndex}>Room {idx + 1}</span>
                        <span style={s.roomName}>
                          {roomA.name || roomB.name || "Unnamed Room"}
                        </span>
                        {(roomA.description || roomB.description) && (
                          <span style={s.roomDesc}>
                            {roomA.description || roomB.description}
                          </span>
                        )}
                      </div>
                      <div style={s.roomDiff}>
                        <div style={s.roomDiffLabel}>Total Difference</div>
                        <div
                          style={{
                            ...s.roomDiffValue,
                            color:
                              roomDifference > 0
                                ? colors.diffPositive
                                : roomDifference < 0
                                  ? colors.diffNegative
                                  : colors.textSecondary,
                          }}
                        >
                          {roomDifference > 0 ? "+" : ""}
                          {formatINR(Math.abs(roomDifference))}
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 0 0" }}>
                      <table style={s.roomTable}>
                        <thead>
                          <tr style={s.roomTableHeader}>
                            <th
                              style={{ ...s.roomTh, textAlign: "left" }}
                              rowSpan="2"
                            >
                              Item
                            </th>
                            <th
                              style={{ ...s.roomTh, textAlign: "center" }}
                              colSpan="3"
                            >
                              {clientA.name}
                            </th>
                            <th
                              style={{ ...s.roomTh, textAlign: "center" }}
                              colSpan="3"
                            >
                              {clientB.name}
                            </th>
                            <th
                              style={{ ...s.roomTh, textAlign: "center" }}
                              rowSpan="2"
                            >
                              Difference
                            </th>
                          </tr>
                          <tr style={s.roomTableHeader}>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Rate
                            </th>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Area
                            </th>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Amount
                            </th>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Rate
                            </th>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Area
                            </th>
                            <th style={{ ...s.roomTh, textAlign: "center" }}>
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td style={s.roomTd}>Frame Work</td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(roomFrameRateA)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {aggA.frameAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggA.framePriceTotal || 0)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(roomFrameRateB)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {aggB.frameAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggB.framePriceTotal || 0)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              <span
                                style={{
                                  color:
                                    getDifference(
                                      aggA.framePriceTotal,
                                      aggB.framePriceTotal,
                                    ) > 0
                                      ? colors.diffPositive
                                      : getDifference(
                                            aggA.framePriceTotal,
                                            aggB.framePriceTotal,
                                          ) < 0
                                        ? colors.diffNegative
                                        : colors.textSecondary,
                                }}
                              >
                                {getDifference(
                                  aggA.framePriceTotal,
                                  aggB.framePriceTotal,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {formatINR(
                                  Math.abs(
                                    getDifference(
                                      aggA.framePriceTotal,
                                      aggB.framePriceTotal,
                                    ),
                                  ),
                                )}
                              </span>
                            </td>
                          </tr>
                          <tr style={{ backgroundColor: colors.surface }}>
                            <td style={s.roomTd}>Box Work</td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(roomBoxRateA)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {aggA.boxAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggA.boxPriceTotal || 0)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(roomBoxRateB)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {aggB.boxAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggB.boxPriceTotal || 0)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              <span
                                style={{
                                  color:
                                    getDifference(
                                      aggA.boxPriceTotal,
                                      aggB.boxPriceTotal,
                                    ) > 0
                                      ? colors.diffPositive
                                      : getDifference(
                                            aggA.boxPriceTotal,
                                            aggB.boxPriceTotal,
                                          ) < 0
                                        ? colors.diffNegative
                                        : colors.textSecondary,
                                }}
                              >
                                {getDifference(
                                  aggA.boxPriceTotal,
                                  aggB.boxPriceTotal,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {formatINR(
                                  Math.abs(
                                    getDifference(
                                      aggA.boxPriceTotal,
                                      aggB.boxPriceTotal,
                                    ),
                                  ),
                                )}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td style={s.roomTd}>Accessories</td>
                            <td
                              style={{
                                ...s.roomTd,
                                textAlign: "center",
                                color: colors.textSecondary,
                              }}
                            >
                              —
                            </td>
                            <td
                              style={{
                                ...s.roomTd,
                                textAlign: "center",
                                color: colors.textSecondary,
                              }}
                            >
                              —
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggA.accessoriesTotal || 0)}
                            </td>
                            <td
                              style={{
                                ...s.roomTd,
                                textAlign: "center",
                                color: colors.textSecondary,
                              }}
                            >
                              —
                            </td>
                            <td
                              style={{
                                ...s.roomTd,
                                textAlign: "center",
                                color: colors.textSecondary,
                              }}
                            >
                              —
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              {formatINR(aggB.accessoriesTotal || 0)}
                            </td>
                            <td style={{ ...s.roomTd, textAlign: "center" }}>
                              <span
                                style={{
                                  color:
                                    getDifference(
                                      aggA.accessoriesTotal,
                                      aggB.accessoriesTotal,
                                    ) > 0
                                      ? colors.diffPositive
                                      : getDifference(
                                            aggA.accessoriesTotal,
                                            aggB.accessoriesTotal,
                                          ) < 0
                                        ? colors.diffNegative
                                        : colors.textSecondary,
                                }}
                              >
                                {getDifference(
                                  aggA.accessoriesTotal,
                                  aggB.accessoriesTotal,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {formatINR(
                                  Math.abs(
                                    getDifference(
                                      aggA.accessoriesTotal,
                                      aggB.accessoriesTotal,
                                    ),
                                  ),
                                )}
                              </span>
                            </td>
                          </tr>
                          <tr style={s.roomTotalRow}>
                            <td style={{ ...s.roomTd, fontWeight: "600" }}>
                              Room Total
                            </td>
                            <td
                              style={{ ...s.roomTd, textAlign: "center" }}
                              colSpan="3"
                            >
                              {formatINR(aggA.roomTotal)}
                            </td>
                            <td
                              style={{ ...s.roomTd, textAlign: "center" }}
                              colSpan="3"
                            >
                              {formatINR(aggB.roomTotal)}
                            </td>
                            <td
                              style={{
                                ...s.roomTd,
                                textAlign: "center",
                                fontWeight: "600",
                              }}
                            >
                              <span
                                style={{
                                  color:
                                    roomDifference > 0
                                      ? colors.diffPositive
                                      : roomDifference < 0
                                        ? colors.diffNegative
                                        : colors.textSecondary,
                                }}
                              >
                                {roomDifference > 0 ? "+" : ""}
                                {formatINR(Math.abs(roomDifference))}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()}
          </>
        )}

        {/* Extras Comparison */}
        {(extrasA.length > 0 || extrasB.length > 0) && (
          <>
            <div style={s.sectionHeader}>
              <div style={s.sectionHeaderAccent} />
              Additional Services Comparison
            </div>
            {(() => {
              const allExtras = [
                ...new Set([
                  ...extrasA.map((e) => e.label || "Service"),
                  ...extrasB.map((e) => e.label || "Service"),
                ]),
              ];
              return (
                <>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.tableHeader}>
                        <th style={s.th}>Service</th>
                        <th style={s.thRight}>{clientA.name}</th>
                        <th style={s.thRight}>{clientB.name}</th>
                        <th style={s.thRight}>Difference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allExtras.map((label, idx) => {
                        const extraA = extrasA.find(
                          (e) => (e.label || "Service") === label,
                        );
                        const extraB = extrasB.find(
                          (e) => (e.label || "Service") === label,
                        );
                        return (
                          <ComparisonRow
                            key={idx}
                            label={label}
                            valueA={extraA?.total || 0}
                            valueB={extraB?.total || 0}
                            colors={colors}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                  <div style={s.extrasSummary}>
                    <span style={{ fontWeight: "500", color: colors.primary }}>
                      Total Additional Services
                    </span>
                    <div style={{ display: "flex", gap: "32px" }}>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.textSecondary,
                          }}
                        >
                          {clientA.name}
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {formatINR(extrasTotalA)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.textSecondary,
                          }}
                        >
                          {clientB.name}
                        </div>
                        <div style={{ fontWeight: "500" }}>
                          {formatINR(extrasTotalB)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.textSecondary,
                          }}
                        >
                          Difference
                        </div>
                        <div
                          style={{
                            fontWeight: "600",
                            color:
                              extrasDifference > 0
                                ? colors.diffPositive
                                : extrasDifference < 0
                                  ? colors.diffNegative
                                  : colors.textSecondary,
                          }}
                        >
                          {extrasDifference > 0 ? "+" : ""}
                          {formatINR(Math.abs(extrasDifference))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* Final Summary */}
        <div style={s.sectionHeader}>
          <div style={s.sectionHeaderAccent} />
          Final Summary
        </div>
        <table style={s.table}>
          <thead>
            <tr style={s.tableHeader}>
              <th style={s.th}>Description</th>
              <th style={s.thRight}>{clientA.name}</th>
              <th style={s.thRight}>{clientB.name}</th>
              <th style={s.thRight}>Difference</th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Rooms Total"
              valueA={roomsTotalA}
              valueB={roomsTotalB}
              colors={colors}
            />
            <ComparisonRow
              label="Additional Services"
              valueA={extrasTotalA}
              valueB={extrasTotalB}
              colors={colors}
            />
            <tr style={{ backgroundColor: colors.surface }}>
              <td style={{ ...s.td, fontWeight: "500" }}>Subtotal</td>
              <td style={s.tdRight}>{formatINR(grandTotalA)}</td>
              <td style={s.tdRight}>{formatINR(grandTotalB)}</td>
              <td style={s.tdRight}>
                <span
                  style={{
                    color:
                      getDifference(grandTotalA, grandTotalB) > 0
                        ? colors.diffPositive
                        : getDifference(grandTotalA, grandTotalB) < 0
                          ? colors.diffNegative
                          : colors.textSecondary,
                  }}
                >
                  {getDifference(grandTotalA, grandTotalB) > 0 ? "+" : ""}
                  {formatINR(Math.abs(getDifference(grandTotalA, grandTotalB)))}
                </span>
              </td>
            </tr>
            <ComparisonRow
              label="Discount"
              valueA={discountA}
              valueB={discountB}
              colors={colors}
              isDiscount
            />
            <tr style={{ backgroundColor: colors.surface }}>
              <td style={{ ...s.td, fontWeight: "600", color: colors.primary }}>
                FINAL AMOUNT
              </td>
              <td style={{ ...s.tdRight, fontWeight: "600" }}>
                {formatINR(finalPayableA)}
              </td>
              <td style={{ ...s.tdRight, fontWeight: "600" }}>
                {formatINR(finalPayableB)}
              </td>
              <td style={{ ...s.tdRight, fontWeight: "600" }}>
                <span
                  style={{
                    color:
                      totalDifference > 0
                        ? colors.diffPositive
                        : totalDifference < 0
                          ? colors.diffNegative
                          : colors.textSecondary,
                  }}
                >
                  {totalDifference > 0 ? "+" : ""}
                  {formatINR(Math.abs(totalDifference))}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <div style={s.footer}>
          <div style={s.footerGrid}>
            <div>
              <div style={s.footerTitle}>Contact Details</div>
              <p style={s.footerText}>
                {(company ?? config.platform).phones.join(" · ")}
              </p>
              <p style={s.footerText}>{(company ?? config.platform).email}</p>
            </div>
            <div style={s.footerNotes}>
              <div style={s.footerTitle}>Report Notes</div>
              <ul style={s.footerNoteList}>
                <li style={s.footerNoteItem}>
                  Differences shown as Invoice A - Invoice B
                </li>
                <li style={s.footerNoteItem}>
                  Positive values indicate Invoice A is higher
                </li>
                <li style={s.footerNoteItem}>
                  Negative values indicate Invoice B is higher
                </li>
                <li style={s.footerNoteItem}>
                  All amounts in Indian Rupees (INR)
                </li>
              </ul>
            </div>
          </div>
          <div style={s.footerBottom}>
            This is an automated comparison report · Report ID: CMP-
            {Date.now().toString().slice(-8)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------
   Helper Components
--------------------------------*/

function QuickStatCard({ label, valueA, valueB, colors, highlight = false }) {
  const diff = getDifference(valueA, valueB);
  const diffColor =
    diff > 0
      ? colors.diffPositive
      : diff < 0
        ? colors.diffNegative
        : colors.textSecondary;

  return (
    <div
      style={
        highlight
          ? {
              backgroundColor: colors.surface,
              borderRadius: "10px",
              padding: "16px",
              border: `1px solid ${colors.accentLight}`,
            }
          : {
              backgroundColor: colors.surfaceLight,
              borderRadius: "10px",
              padding: "16px",
              border: `1px solid ${colors.borderLight}`,
            }
      }
    >
      <div
        style={{
          fontSize: "11px",
          color: colors.textSecondary,
          marginBottom: "8px",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "20px",
          fontWeight: "700",
          marginBottom: "8px",
          color: diffColor,
        }}
      >
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </div>
      <div style={{ fontSize: "11px", color: colors.textSecondary }}>
        <div>A: {formatINR(valueA)}</div>
        <div>B: {formatINR(valueB)}</div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, valueA, valueB, colors, isDiscount = false }) {
  const diff = getDifference(valueA, valueB);
  const diffColor =
    diff > 0
      ? colors.diffPositive
      : diff < 0
        ? colors.diffNegative
        : colors.textSecondary;

  const formatValue = (val) => {
    if (isDiscount && val > 0) return `- ${formatINR(val)}`;
    return formatINR(val || 0);
  };

  return (
    <tr>
      <td
        style={{
          padding: "10px 12px",
          borderBottom: `1px solid ${colors.borderLight}`,
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "10px 12px",
          textAlign: "right",
          borderBottom: `1px solid ${colors.borderLight}`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(valueA)}
      </td>
      <td
        style={{
          padding: "10px 12px",
          textAlign: "right",
          borderBottom: `1px solid ${colors.borderLight}`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(valueB)}
      </td>
      <td
        style={{
          padding: "10px 12px",
          textAlign: "right",
          borderBottom: `1px solid ${colors.borderLight}`,
          fontVariantNumeric: "tabular-nums",
          color: diffColor,
        }}
      >
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </td>
    </tr>
  );
}

/* -------------------------------
   Utility Functions
--------------------------------*/

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function getDifference(a, b) {
  const numA = Number(a) || 0;
  const numB = Number(b) || 0;
  return numA - numB;
}

function calcRoomAggregates(room = {}, frameworkRate = 0, boxRate = 0) {
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
  const roomTotal = itemsTotal + accessoriesTotal;
  const roomFrameRate =
    typeof room.frameRate === "number" ? room.frameRate : frameworkRate;
  const roomBoxRate = typeof room.boxRate === "number" ? room.boxRate : boxRate;
  return {
    frameAreaTotal,
    boxAreaTotal,
    framePriceTotal,
    boxPriceTotal,
    accessoriesTotal,
    itemsTotal,
    roomTotal,
    accessories,
    roomFrameRate,
    roomBoxRate,
  };
}

function calcExtrasTotal(extras = []) {
  return extras.reduce((sum, ex) => sum + Number(ex.total || 0), 0);
}

export default CompareInvoicesT3;
export { InvoiceComparisonReport };
