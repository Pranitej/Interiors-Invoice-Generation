import { useState, useEffect } from "react";
import api from "../api/api";
import { forwardRef } from "react";
import config from "../config.js";

/* -------------------------------
   CompareInvoicesT2 Component
--------------------------------*/

const CompareInvoicesT2 = forwardRef(
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
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <div
            style={{
              display: "inline-block",
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              height: "32px",
              width: "32px",
              borderBottom: "2px solid #2563eb",
            }}
          ></div>
          <p style={{ marginTop: "8px", color: "#6b7280" }}>
            Loading comparison report...
          </p>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{ textAlign: "center", padding: "48px 0", color: "#ef4444" }}
        >
          <p>{error}</p>
        </div>
      );
    }

    if (!invoiceA || !invoiceB) {
      return (
        <div
          style={{ textAlign: "center", padding: "48px 0", color: "#9ca3af" }}
        >
          Please select two invoices to compare
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
   Invoice Comparison Report Component — Light Professional
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

  const colors = {
    primary: "#2563eb",
    primaryLight: "#eff6ff",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
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

  const pageWidth = "210mm";

  return (
    <div
      ref={ref}
      id="invoice-comparison-report"
      style={{
        backgroundColor: "#ffffff",
        color: colors.gray[700],
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        fontSize: "12px",
        lineHeight: "1.5",
        width: pageWidth,
        margin: "0 auto",
        border: `1px solid ${colors.gray[200]}`,
        borderRadius: "12px",
        overflow: "hidden",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Report Header - Light */}
      <div
        style={{
          backgroundColor: colors.gray[100],
          padding: "20px 24px",
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                width: "56px",
                height: "56px",
                flexShrink: 0,
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${colors.gray[200]}`,
              }}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/${(company ?? config.platform).logoFile}`}
                alt={`${(company ?? config.platform).name} Logo`}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.parentElement.innerHTML =
                    '<span style="font-size:24px;">🏢</span>';
                }}
              />
            </div>
            <div>
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  letterSpacing: "-0.02em",
                  margin: 0,
                  color: colors.gray[800],
                }}
              >
                {(company ?? config.platform).name}
              </h1>
              <p
                style={{
                  fontSize: "10px",
                  color: colors.gray[500],
                  marginTop: "4px",
                  marginBottom: 0,
                }}
              >
                {(company ?? config.platform).registeredOffice}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: colors.gray[500],
                  marginTop: "2px",
                  marginBottom: 0,
                }}
              >
                {(company ?? config.platform).phones.join(", ")} |{" "}
                {(company ?? config.platform).email}
              </p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "700",
                color: colors.gray[800],
                margin: 0,
              }}
            >
              COMPARISON REPORT
            </h2>
            <p
              style={{
                fontSize: "10px",
                color: colors.gray[500],
                marginTop: "4px",
              }}
            >
              Invoice vs Invoice Analysis
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details Side by Side */}
      <div
        style={{
          padding: "24px",
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.gray[800],
            marginBottom: "16px",
          }}
        >
          Invoice Details
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
          }}
        >
          {/* Invoice A */}
          <div
            style={{
              border: `1px solid ${colors.gray[200]}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: colors.gray[50],
                padding: "12px 16px",
                borderBottom: `1px solid ${colors.gray[200]}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "600", color: colors.gray[700] }}>
                  INVOICE A
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {invoiceA.invoiceType || "Proforma"}
                </span>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <DetailRow label="Invoice No" value={invoiceIdShortA} />
              <DetailRow label="Date" value={invoiceDateA} />
              <DetailRow label="Client" value={clientA.name} />
              <DetailRow label="Mobile" value={clientA.mobile} />
              <DetailRow
                label="Site Address"
                value={clientA.siteAddress}
                fullWidth
              />
              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: `1px solid ${colors.gray[200]}`,
                }}
              >
                <DetailRow
                  label="Total Amount"
                  value={formatINR(finalPayableA)}
                  bold
                />
              </div>
            </div>
          </div>
          {/* Invoice B */}
          <div
            style={{
              border: `1px solid ${colors.gray[200]}`,
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                backgroundColor: colors.gray[50],
                padding: "12px 16px",
                borderBottom: `1px solid ${colors.gray[200]}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "600", color: colors.gray[700] }}>
                  INVOICE B
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    backgroundColor: colors.primaryLight,
                    color: colors.primary,
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {invoiceB.invoiceType || "Proforma"}
                </span>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <DetailRow label="Invoice No" value={invoiceIdShortB} />
              <DetailRow label="Date" value={invoiceDateB} />
              <DetailRow label="Client" value={clientB.name} />
              <DetailRow label="Mobile" value={clientB.mobile} />
              <DetailRow
                label="Site Address"
                value={clientB.siteAddress}
                fullWidth
              />
              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: `1px solid ${colors.gray[200]}`,
                }}
              >
                <DetailRow
                  label="Total Amount"
                  value={formatINR(finalPayableB)}
                  bold
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Comparison Summary */}
      <div
        style={{
          padding: "24px",
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.gray[800],
            marginBottom: "16px",
          }}
        >
          Quick Comparison
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
          }}
        >
          <SummaryCard
            label="Rooms Difference"
            valueA={roomsTotalA}
            valueB={roomsTotalB}
          />
          <SummaryCard
            label="Extras Difference"
            valueA={extrasTotalA}
            valueB={extrasTotalB}
          />
          <SummaryCard
            label="Discount Difference"
            valueA={discountA}
            valueB={discountB}
          />
          <SummaryCard
            label="Total Difference"
            valueA={finalPayableA}
            valueB={finalPayableB}
            highlight
          />
        </div>
        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: `1px solid ${colors.gray[200]}`,
          }}
        >
          <p style={{ fontSize: "11px", color: colors.gray[500], margin: 0 }}>
            Percentage Difference:{" "}
            <span style={{ fontWeight: "500", color: colors.gray[700] }}>
              {percentageDifference}%
            </span>{" "}
            | {roomsA.length} rooms vs {roomsB.length} rooms | {extrasA.length}{" "}
            extras vs {extrasB.length} extras
          </p>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div
        style={{
          padding: "24px",
          borderBottom: `1px solid ${colors.gray[200]}`,
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.gray[800],
            marginBottom: "16px",
          }}
        >
          Pricing Comparison
        </h3>
        <table
          style={{
            width: "100%",
            fontSize: "12px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: colors.gray[50],
                borderBottom: `2px solid ${colors.gray[200]}`,
              }}
            >
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Rate Type
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Invoice A
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Invoice B
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Frame Work Rate (per sqft)"
              valueA={frameworkRateA}
              valueB={frameworkRateB}
            />
            <ComparisonRow
              label="Box Work Rate (per sqft)"
              valueA={boxRateA}
              valueB={boxRateB}
            />
          </tbody>
        </table>
      </div>

      {/* Roomwise Comparison */}
      {(roomsA.length > 0 || roomsB.length > 0) && (
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${colors.gray[200]}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: colors.gray[800],
                margin: 0,
              }}
            >
              Roomwise Comparison
            </h3>
            <span style={{ fontSize: "11px", color: colors.gray[500] }}>
              {roomsA.length} rooms vs {roomsB.length} rooms
            </span>
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
                <div
                  key={idx}
                  style={{
                    marginBottom: "16px",
                    border: `1px solid ${colors.gray[200]}`,
                    borderRadius: "10px",
                    overflow: "hidden",
                  }}
                >
                  {/* Room Header */}
                  <div
                    style={{
                      backgroundColor: colors.gray[50],
                      padding: "12px 16px",
                      borderBottom: `1px solid ${colors.gray[200]}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: colors.primary,
                              backgroundColor: colors.primaryLight,
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            Room {idx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: "600",
                              color: colors.gray[700],
                            }}
                          >
                            {roomA.name || roomB.name || "Unnamed Room"}
                          </span>
                        </div>
                        {(roomA.description || roomB.description) && (
                          <p
                            style={{
                              fontSize: "10px",
                              color: colors.gray[500],
                              marginTop: "4px",
                              marginBottom: 0,
                            }}
                          >
                            {roomA.description || roomB.description}
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{ fontSize: "10px", color: colors.gray[500] }}
                        >
                          Difference
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                              roomDifference > 0
                                ? colors.success
                                : roomDifference < 0
                                  ? colors.error
                                  : colors.gray[600],
                          }}
                        >
                          {roomDifference > 0 ? "+" : ""}
                          {formatINR(Math.abs(roomDifference))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Content */}
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{
                        width: "100%",
                        fontSize: "11px",
                        borderCollapse: "collapse",
                      }}
                    >
                      <thead>
                        <tr style={{ backgroundColor: colors.gray[100] }}>
                          <th
                            style={{
                              padding: "8px 12px",
                              textAlign: "left",
                              fontWeight: "600",
                              color: colors.gray[600],
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                          >
                            Item
                          </th>
                          <th
                            style={{
                              padding: "8px 12px",
                              textAlign: "center",
                              fontWeight: "600",
                              color: colors.gray[600],
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                            colSpan="3"
                          >
                            Invoice A
                          </th>
                          <th
                            style={{
                              padding: "8px 12px",
                              textAlign: "center",
                              fontWeight: "600",
                              color: colors.gray[600],
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                            colSpan="3"
                          >
                            Invoice B
                          </th>
                          <th
                            style={{
                              padding: "8px 12px",
                              textAlign: "center",
                              fontWeight: "600",
                              color: colors.gray[600],
                              borderBottom: `1px solid ${colors.gray[200]}`,
                            }}
                          >
                            Difference
                          </th>
                        </tr>
                        <tr style={{ backgroundColor: colors.gray[50] }}>
                          <th style={{ padding: "4px 12px" }}></th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Area
                          </th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Area
                          </th>
                          <th
                            style={{
                              padding: "4px 12px",
                              textAlign: "right",
                              fontWeight: "500",
                              color: colors.gray[500],
                            }}
                          >
                            Amount
                          </th>
                          <th style={{ padding: "4px 12px" }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        <RoomComparisonRow
                          label="Frame Work"
                          rateA={roomFrameRateA}
                          areaA={aggA.frameAreaTotal}
                          amountA={aggA.framePriceTotal}
                          rateB={roomFrameRateB}
                          areaB={aggB.frameAreaTotal}
                          amountB={aggB.framePriceTotal}
                        />
                        <RoomComparisonRow
                          label="Box Work"
                          rateA={roomBoxRateA}
                          areaA={aggA.boxAreaTotal}
                          amountA={aggA.boxPriceTotal}
                          rateB={roomBoxRateB}
                          areaB={aggB.boxAreaTotal}
                          amountB={aggB.boxPriceTotal}
                        />
                        <RoomComparisonRow
                          label="Accessories"
                          amountA={aggA.accessoriesTotal}
                          amountB={aggB.accessoriesTotal}
                        />
                        <tr style={{ backgroundColor: colors.gray[100] }}>
                          <td
                            style={{
                              padding: "10px 12px",
                              fontWeight: "600",
                              color: colors.gray[700],
                            }}
                          >
                            Room Total
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: "600",
                              color: colors.gray[700],
                            }}
                            colSpan="3"
                          >
                            {formatINR(aggA.roomTotal)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: "600",
                              color: colors.gray[700],
                            }}
                            colSpan="3"
                          >
                            {formatINR(aggB.roomTotal)}
                          </td>
                          <td
                            style={{
                              padding: "10px 12px",
                              textAlign: "right",
                              fontWeight: "600",
                              color:
                                roomDifference > 0
                                  ? colors.success
                                  : roomDifference < 0
                                    ? colors.error
                                    : colors.gray[600],
                            }}
                          >
                            {roomDifference > 0 ? "+" : ""}
                            {formatINR(Math.abs(roomDifference))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Extras Comparison */}
      {(extrasA.length > 0 || extrasB.length > 0) && (
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${colors.gray[200]}`,
          }}
        >
          <h3
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.gray[800],
              marginBottom: "16px",
            }}
          >
            Additional Services Comparison
          </h3>
          {(() => {
            const allExtras = [
              ...new Set([
                ...extrasA.map((e) => e.label || "Service"),
                ...extrasB.map((e) => e.label || "Service"),
              ]),
            ];
            return (
              <>
                <table
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    borderCollapse: "collapse",
                    marginBottom: "16px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: colors.gray[50],
                        borderBottom: `2px solid ${colors.gray[200]}`,
                      }}
                    >
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "left",
                          fontWeight: "600",
                          color: colors.gray[600],
                        }}
                      >
                        Service
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: colors.gray[600],
                        }}
                      >
                        Invoice A
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: colors.gray[600],
                        }}
                      >
                        Invoice B
                      </th>
                      <th
                        style={{
                          padding: "10px 12px",
                          textAlign: "right",
                          fontWeight: "600",
                          color: colors.gray[600],
                        }}
                      >
                        Difference
                      </th>
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
                        />
                      );
                    })}
                  </tbody>
                </table>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    backgroundColor: colors.gray[50],
                    borderRadius: "8px",
                  }}
                >
                  <span style={{ fontWeight: "500", color: colors.gray[700] }}>
                    Total Additional Services
                  </span>
                  <div style={{ display: "flex", gap: "32px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{ fontSize: "10px", color: colors.gray[500] }}
                      >
                        Invoice A
                      </div>
                      <div
                        style={{ fontWeight: "600", color: colors.gray[700] }}
                      >
                        {formatINR(extrasTotalA)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{ fontSize: "10px", color: colors.gray[500] }}
                      >
                        Invoice B
                      </div>
                      <div
                        style={{ fontWeight: "600", color: colors.gray[700] }}
                      >
                        {formatINR(extrasTotalB)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{ fontSize: "10px", color: colors.gray[500] }}
                      >
                        Difference
                      </div>
                      <div
                        style={{
                          fontWeight: "600",
                          color:
                            extrasDifference > 0
                              ? colors.success
                              : extrasDifference < 0
                                ? colors.error
                                : colors.gray[600],
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
        </div>
      )}

      {/* Final Summary Comparison */}
      <div style={{ padding: "24px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: "600",
            color: colors.gray[800],
            marginBottom: "16px",
          }}
        >
          Final Summary Comparison
        </h3>
        <table
          style={{
            width: "100%",
            fontSize: "12px",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                backgroundColor: colors.gray[50],
                borderBottom: `2px solid ${colors.gray[200]}`,
              }}
            >
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Invoice A
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Invoice B
              </th>
              <th
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "600",
                  color: colors.gray[600],
                }}
              >
                Difference
              </th>
            </tr>
          </thead>
          <tbody>
            <ComparisonRow
              label="Rooms Total"
              valueA={roomsTotalA}
              valueB={roomsTotalB}
            />
            <ComparisonRow
              label="Additional Services"
              valueA={extrasTotalA}
              valueB={extrasTotalB}
            />
            <tr style={{ borderBottom: `1px solid ${colors.gray[200]}` }}>
              <td
                style={{
                  padding: "10px 12px",
                  fontWeight: "500",
                  backgroundColor: colors.gray[50],
                }}
              >
                Subtotal
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "500",
                  backgroundColor: colors.gray[50],
                }}
              >
                {formatINR(grandTotalA)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "500",
                  backgroundColor: colors.gray[50],
                }}
              >
                {formatINR(grandTotalB)}
              </td>
              <td
                style={{
                  padding: "10px 12px",
                  textAlign: "right",
                  fontWeight: "500",
                  backgroundColor: colors.gray[50],
                }}
              >
                <span
                  style={{
                    color:
                      getDifference(grandTotalA, grandTotalB) > 0
                        ? colors.success
                        : getDifference(grandTotalA, grandTotalB) < 0
                          ? colors.error
                          : colors.gray[600],
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
              isDiscount
            />
            <tr style={{ backgroundColor: colors.gray[100] }}>
              <td
                style={{
                  padding: "12px 16px",
                  fontWeight: "700",
                  color: colors.gray[800],
                }}
              >
                FINAL AMOUNT
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontWeight: "700",
                  color: colors.gray[800],
                }}
              >
                {formatINR(finalPayableA)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontWeight: "700",
                  color: colors.gray[800],
                }}
              >
                {formatINR(finalPayableB)}
              </td>
              <td
                style={{
                  padding: "12px 16px",
                  textAlign: "right",
                  fontWeight: "700",
                  color:
                    totalDifference > 0
                      ? colors.success
                      : totalDifference < 0
                        ? colors.error
                        : colors.gray[600],
                }}
              >
                {totalDifference > 0 ? "+" : ""}
                {formatINR(Math.abs(totalDifference))}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${colors.gray[200]}`,
          padding: "20px 24px",
          backgroundColor: colors.gray[50],
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <h4
              style={{
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: colors.gray[500],
                marginBottom: "8px",
              }}
            >
              Contact Details
            </h4>
            <p
              style={{
                fontSize: "10px",
                color: colors.gray[600],
                marginBottom: "2px",
              }}
            >
              {(company ?? config.platform).phones.join(" | ")}
            </p>
            <p style={{ fontSize: "10px", color: colors.gray[600] }}>
              {(company ?? config.platform).email}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h4
              style={{
                fontSize: "10px",
                fontWeight: "600",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: colors.gray[500],
                marginBottom: "8px",
              }}
            >
              Report Notes
            </h4>
            <ul
              style={{
                fontSize: "10px",
                color: colors.gray[500],
                padding: 0,
                margin: 0,
                listStyle: "none",
              }}
            >
              <li style={{ marginBottom: "2px" }}>
                • Differences shown as Invoice A - Invoice B
              </li>
              <li style={{ marginBottom: "2px" }}>
                • Positive values indicate Invoice A is higher
              </li>
              <li style={{ marginBottom: "2px" }}>
                • Negative values indicate Invoice B is higher
              </li>
              <li>• All amounts in Indian Rupees (INR)</li>
            </ul>
          </div>
        </div>
        <div
          style={{
            marginTop: "16px",
            paddingTop: "12px",
            borderTop: `1px solid ${colors.gray[200]}`,
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "9px", color: colors.gray[400], margin: 0 }}>
            This is an automated comparison report generated by{" "}
            {(company ?? config.platform).name} Invoice System
          </p>
          <p
            style={{
              fontSize: "9px",
              color: colors.gray[400],
              marginTop: "2px",
            }}
          >
            Report ID: CMP-{Date.now().toString().slice(-8)}
          </p>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------
   Helper Components
--------------------------------*/

function DetailRow({ label, value, fullWidth = false, bold = false }) {
  if (!value && value !== 0) return null;
  const colors = { gray: { 500: "#6b7280", 600: "#4b5563", 700: "#374151" } };
  if (fullWidth) {
    return (
      <div style={{ padding: "4px 0", fontSize: "11px" }}>
        <span style={{ fontWeight: "500", color: colors.gray[500] }}>
          {label}:
        </span>{" "}
        <span
          style={{
            fontWeight: bold ? "600" : "400",
            color: bold ? colors.gray[700] : colors.gray[600],
          }}
        >
          {value}
        </span>
      </div>
    );
  }
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: "11px",
      }}
    >
      <span style={{ fontWeight: "500", color: colors.gray[500] }}>
        {label}
      </span>
      <span
        style={{
          fontWeight: bold ? "600" : "400",
          color: bold ? colors.gray[700] : colors.gray[600],
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryCard({ label, valueA, valueB, highlight = false }) {
  const diff = getDifference(valueA, valueB);
  const colors = {
    primary: "#2563eb",
    success: "#10b981",
    error: "#ef4444",
    gray: { 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151" },
  };
  const diffColor =
    diff > 0 ? colors.success : diff < 0 ? colors.error : colors.gray[500];
  return (
    <div
      style={{
        border: highlight ? `2px solid ${colors.primary}` : `1px solid #e5e7eb`,
        borderRadius: "10px",
        padding: "12px",
        backgroundColor: highlight ? colors.primaryLight : "#ffffff",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: "500",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: colors.gray[500],
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: "700", color: diffColor }}>
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </div>
      <div
        style={{ fontSize: "10px", color: colors.gray[500], marginTop: "8px" }}
      >
        <div>A: {formatINR(valueA)}</div>
        <div>B: {formatINR(valueB)}</div>
      </div>
    </div>
  );
}

function ComparisonRow({ label, valueA, valueB, isDiscount = false }) {
  const diff = getDifference(valueA, valueB);
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    gray: { 500: "#6b7280", 600: "#4b5563", 700: "#374151" },
  };
  const diffColor =
    diff > 0 ? colors.success : diff < 0 ? colors.error : colors.gray[500];
  const formatValue = (val) => {
    if (isDiscount && val > 0) return `- ${formatINR(val)}`;
    return formatINR(val || 0);
  };
  return (
    <tr style={{ borderBottom: `1px solid #f3f4f6` }}>
      <td style={{ padding: "8px 12px", color: colors.gray[600] }}>{label}</td>
      <td
        style={{
          padding: "8px 12px",
          textAlign: "right",
          fontWeight: "500",
          color: colors.gray[600],
        }}
      >
        {formatValue(valueA)}
      </td>
      <td
        style={{
          padding: "8px 12px",
          textAlign: "right",
          fontWeight: "500",
          color: colors.gray[600],
        }}
      >
        {formatValue(valueB)}
      </td>
      <td
        style={{
          padding: "8px 12px",
          textAlign: "right",
          fontWeight: "500",
          color: diffColor,
        }}
      >
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </td>
    </tr>
  );
}

function RoomComparisonRow({
  label,
  rateA,
  areaA,
  amountA,
  rateB,
  areaB,
  amountB,
}) {
  const diff = getDifference(amountA, amountB);
  const colors = {
    success: "#10b981",
    error: "#ef4444",
    gray: { 400: "#9ca3af", 500: "#6b7280", 600: "#4b5563", 700: "#374151" },
  };
  const diffColor =
    diff > 0 ? colors.success : diff < 0 ? colors.error : colors.gray[500];
  const hasRate = rateA !== undefined && rateB !== undefined;

  return (
    <tr style={{ borderBottom: `1px solid #f3f4f6` }}>
      <td
        style={{
          padding: "8px 12px",
          fontWeight: "500",
          color: colors.gray[600],
        }}
      >
        {label}
      </td>
      {hasRate ? (
        <>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              color: colors.gray[600],
            }}
          >
            {formatINR(rateA)}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              color: colors.gray[600],
            }}
          >
            {areaA?.toFixed(2) || "0.00"}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              fontWeight: "500",
              color: colors.gray[700],
            }}
          >
            {formatINR(amountA || 0)}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              color: colors.gray[600],
            }}
          >
            {formatINR(rateB)}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              color: colors.gray[600],
            }}
          >
            {areaB?.toFixed(2) || "0.00"}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              fontWeight: "500",
              color: colors.gray[700],
            }}
          >
            {formatINR(amountB || 0)}
          </td>
        </>
      ) : (
        <>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "center",
              color: colors.gray[400],
            }}
            colSpan="2"
          >
            —
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              fontWeight: "500",
              color: colors.gray[700],
            }}
          >
            {formatINR(amountA || 0)}
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "center",
              color: colors.gray[400],
            }}
            colSpan="2"
          >
            —
          </td>
          <td
            style={{
              padding: "8px 12px",
              textAlign: "right",
              fontFamily: "'SF Mono', monospace",
              fontWeight: "500",
              color: colors.gray[700],
            }}
          >
            {formatINR(amountB || 0)}
          </td>
        </>
      )}
      <td
        style={{
          padding: "8px 12px",
          textAlign: "right",
          fontWeight: "500",
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

export default CompareInvoicesT2;
export { InvoiceComparisonReport };
