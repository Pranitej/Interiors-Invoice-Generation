import { useState, useEffect } from "react";
import api from "../api/api";
import { forwardRef } from "react";

/* -------------------------------
   CompareInvoices Component
--------------------------------*/

const CompareInvoices = forwardRef(
  ({ invoiceAId, invoiceBId, onLoadedA, onLoadedB }, ref) => {
    const [invoiceA, setInvoiceA] = useState(null);
    const [invoiceB, setInvoiceB] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Load selected invoices
    useEffect(() => {
      async function fetchInvoices() {
        if (!invoiceAId || !invoiceBId) return;

        try {
          setLoading(true);
          setError(null);
          const [resA, resB] = await Promise.all([
            api.get(`/invoices/${invoiceAId}`),
            api.get(`/invoices/${invoiceBId}`),
          ]);
          setInvoiceA(resA.data);
          setInvoiceB(resB.data);
          onLoadedA?.(resA.data);
          onLoadedB?.(resB.data);
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
      console.log("Hello");
    }, [invoiceAId, invoiceBId, onLoadedA, onLoadedB]);

    if (loading) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
          }}
        >
          <div
            style={{
              display: "inline-block",
              animation: "spin 1s linear infinite",
              borderRadius: "50%",
              height: "32px",
              width: "32px",
              borderBottom: "2px solid #4b5563",
            }}
          ></div>
          <p
            style={{
              marginTop: "8px",
              color: "#4b5563",
            }}
          >
            Loading comparison report...
          </p>
          <style>
            {`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      );
    }

    if (error) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "#dc2626",
          }}
        >
          <p>{error}</p>
        </div>
      );
    }

    if (!invoiceA || !invoiceB) {
      return (
        <div
          style={{
            textAlign: "center",
            padding: "48px 0",
            color: "#6b7280",
          }}
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
      />
    );
  },
);

/* -------------------------------
   Invoice Comparison Report Component
--------------------------------*/

function InvoiceComparisonReport({ invoiceA, invoiceB }, ref) {
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

  // Calculate totals
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

  // Dates
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

  // Calculate differences
  const totalDifference = getDifference(finalPayableA, finalPayableB);
  const extrasDifference = getDifference(extrasTotalA, extrasTotalB);
  const percentageDifference = (
    (Math.abs(totalDifference) / Math.max(finalPayableA, finalPayableB)) *
    100
  ).toFixed(1);

  // Fixed width for printing
  const pageWidth = "210mm"; // A4 width
  const contentWidth = "190mm";

  return (
    <div
      ref={ref}
      id="invoice-comparison-report"
      style={{
        backgroundColor: "white",
        color: "#1f2937",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
        fontSize: "14px",
        lineHeight: "1.5",
        width: pageWidth,
        margin: "0 auto",
        border: "1px solid #d1d5db",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Report Header */}
      <div
        style={{
          borderBottom: "2px solid #1f2937",
          padding: "8px 10px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
            }}
          >
            {/* Logo Container */}
            <div
              style={{
                width: "64px",
                height: "64px",
                flexShrink: 0,
                marginTop: "4px",
              }}
            >
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                alt="Skanda Industries Logo"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
                    <div style="width: 64px; height: 64px; border: 1px solid #d1d5db; background-color: #f3f4f6; display: flex; align-items: center; justify-content: center;">
                      <span style="font-size: 12px; font-weight: bold; color: #374151;">SKANDA</span>
                    </div>
                  `;
                }}
              />
            </div>

            <div>
              <h1
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  letterSpacing: "-0.025em",
                  margin: 0,
                }}
              >
                SKANDA INDUSTRIES
              </h1>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                  lineHeight: "1.25",
                  marginTop: "4px",
                  marginBottom: "2px",
                }}
              >
                <span style={{ fontWeight: "500" }}>Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                  marginBottom: "2px",
                }}
              >
                <span style={{ fontWeight: "500" }}>Industry:</span> Sy No.
                138/A/1 & 138/2, Elkurthi Road, Grama Panchayat Office,
                Dharmasagar, Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "#4b5563",
                }}
              >
                <span style={{ fontWeight: "500" }}>Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span style={{ fontWeight: "500" }}>Email: </span>
                industry.skanda@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Comparison Header */}
      <div
        style={{
          padding: "24px 40px",
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
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
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: 0,
              }}
            >
              INVOICE COMPARISON
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginTop: "4px",
                marginBottom: 0,
              }}
            >
              Detailed comparison between two invoices
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              Total Difference
            </p>
            <p
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                margin: 0,
                color:
                  totalDifference > 0
                    ? "#059669"
                    : totalDifference < 0
                      ? "#dc2626"
                      : "#1f2937",
              }}
            >
              {totalDifference > 0 ? "+" : ""}
              {formatINR(Math.abs(totalDifference))}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details Side by Side */}
      <div
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          INVOICE DETAILS
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "32px",
            width: contentWidth,
          }}
        >
          {/* Invoice A */}
          <div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h4
                  style={{
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  INVOICE A
                </h4>
                <span
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {invoiceA.invoiceType || "Proforma"}
                </span>
              </div>
              <table style={{ width: "100%", fontSize: "14px" }}>
                <tbody>
                  <DetailRow label="Invoice No" value={invoiceIdShortA} />
                  <DetailRow label="Date" value={invoiceDateA} />
                  <DetailRow label="Client" value={clientA.name} />
                  <DetailRow label="Mobile" value={clientA.mobile} />
                  <DetailRow
                    label="Site Address"
                    value={clientA.siteAddress}
                    fullWidth
                  />
                  <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 0", fontWeight: "500" }}>
                      Total Amount
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {formatINR(finalPayableA)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice B */}
          <div>
            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "16px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <h4
                  style={{
                    fontWeight: "bold",
                    color: "#1f2937",
                    margin: 0,
                  }}
                >
                  INVOICE B
                </h4>
                <span
                  style={{
                    fontSize: "12px",
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "2px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {invoiceB.invoiceType || "Proforma"}
                </span>
              </div>
              <table style={{ width: "100%", fontSize: "14px" }}>
                <tbody>
                  <DetailRow label="Invoice No" value={invoiceIdShortB} />
                  <DetailRow label="Date" value={invoiceDateB} />
                  <DetailRow label="Client" value={clientB.name} />
                  <DetailRow label="Mobile" value={clientB.mobile} />
                  <DetailRow
                    label="Site Address"
                    value={clientB.siteAddress}
                    fullWidth
                  />
                  <tr style={{ borderTop: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "8px 0", fontWeight: "500" }}>
                      Total Amount
                    </td>
                    <td
                      style={{
                        padding: "8px 0",
                        textAlign: "right",
                        fontWeight: "bold",
                      }}
                    >
                      {formatINR(finalPayableB)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Comparison Summary */}
      <div
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          QUICK COMPARISON
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr",
            gap: "16px",
            width: contentWidth,
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
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              color: "#4b5563",
              margin: 0,
            }}
          >
            Percentage Difference:{" "}
            <span style={{ fontWeight: "500" }}>{percentageDifference}%</span> |{" "}
            {roomsA.length} rooms vs {roomsB.length} rooms | {extrasA.length}{" "}
            extras vs {extrasB.length} extras
          </p>
        </div>
      </div>

      {/* Pricing Comparison */}
      <div
        style={{
          padding: "24px 40px",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          PRICING COMPARISON
        </h3>
        <table
          style={{
            width: "100%",
            fontSize: "14px",
            border: "1px solid #e5e7eb",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Rate Type
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {clientA.name}
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {clientB.name}
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
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

      {/* Roomwise Comparison - Professional Compact */}
      {(roomsA.length > 0 || roomsB.length > 0) && (
        <div
          style={{
            padding: "24px 40px",
            borderBottom: "1px solid #e5e7eb",
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
                fontSize: "16px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: 0,
              }}
            >
              ROOM WISE COMPARISON
            </h3>
            <div
              style={{
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              {roomsA.length} rooms vs {roomsB.length} rooms
            </div>
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

              // Get room-specific rates
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
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  {/* Room Header */}
                  <div
                    style={{
                      backgroundColor: "#f3f4f6",
                      padding: "12px 16px",
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
                              fontSize: "14px",
                              fontWeight: "600",
                              color: "#374151",
                            }}
                          >
                            Room {idx + 1}
                          </span>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "#1f2937",
                            }}
                          >
                            {roomA.name || roomB.name || "Unnamed Room"}
                          </span>
                        </div>
                        {roomA.description || roomB.description ? (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "#4b5563",
                              marginTop: "4px",
                              marginBottom: 0,
                            }}
                          >
                            {roomA.description || roomB.description}
                          </p>
                        ) : null}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#4b5563",
                          }}
                        >
                          Total Difference
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color:
                              roomDifference > 0
                                ? "#059669"
                                : roomDifference < 0
                                  ? "#dc2626"
                                  : "#4b5563",
                          }}
                        >
                          {roomDifference > 0 ? "+" : ""}
                          {formatINR(Math.abs(roomDifference))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Room Content */}
                  <div style={{ padding: 0 }}>
                    {/* Comparison Table */}
                    <div style={{ overflowX: "visible" }}>
                      <table style={{ width: "100%", fontSize: "12px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            <th
                              style={{
                                paddingBottom: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "2px solid #d1d5db",
                              }}
                              rowSpan="2"
                            >
                              Item
                            </th>

                            {/* Invoice A Header */}
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "2px solid #d1d5db",
                              }}
                              colSpan="3"
                            >
                              {clientA.name}
                            </th>

                            {/* Invoice B Header */}
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "2px solid #d1d5db",
                              }}
                              colSpan="3"
                            >
                              {clientB.name}
                            </th>

                            {/* Difference Header */}
                            <th
                              style={{
                                paddingBottom: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                              }}
                              rowSpan="2"
                            >
                              Difference
                            </th>
                          </tr>
                          <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                            {/* Invoice A Sub-headers */}
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              Rate
                            </th>
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              Area
                            </th>
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Amount
                            </th>

                            {/* Invoice B Sub-headers */}
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              Rate
                            </th>
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              Area
                            </th>
                            <th
                              style={{
                                padding: "4px 0",
                                textAlign: "center",
                                fontWeight: "500",
                                color: "#374151",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Frame Work */}
                          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td
                              style={{
                                padding: "8px",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Frame Work
                            </td>

                            {/* Invoice A */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {formatINR(roomFrameRateA)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {aggA.frameAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggA.framePriceTotal || 0)}
                            </td>

                            {/* Invoice B */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {formatINR(roomFrameRateB)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {aggB.frameAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggB.framePriceTotal || 0)}
                            </td>

                            {/* Difference */}
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color:
                                      getDifference(
                                        aggA.framePriceTotal,
                                        aggB.framePriceTotal,
                                      ) > 0
                                        ? "#059669"
                                        : getDifference(
                                              aggA.framePriceTotal,
                                              aggB.framePriceTotal,
                                            ) < 0
                                          ? "#dc2626"
                                          : "#4b5563",
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
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Box Work */}
                          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td
                              style={{
                                padding: "8px",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Box Work
                            </td>

                            {/* Invoice A */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {formatINR(roomBoxRateA)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {aggA.boxAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggA.boxPriceTotal || 0)}
                            </td>

                            {/* Invoice B */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {formatINR(roomBoxRateB)}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              {aggB.boxAreaTotal?.toFixed(2) || "0.00"}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggB.boxPriceTotal || 0)}
                            </td>

                            {/* Difference */}
                            <td style={{ padding: "8px", textAlign: "center" }}>
                              <div>
                                <div
                                  style={{
                                    fontWeight: "500",
                                    color:
                                      getDifference(
                                        aggA.boxPriceTotal,
                                        aggB.boxPriceTotal,
                                      ) > 0
                                        ? "#059669"
                                        : getDifference(
                                              aggA.boxPriceTotal,
                                              aggB.boxPriceTotal,
                                            ) < 0
                                          ? "#dc2626"
                                          : "#4b5563",
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
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* Accessories */}
                          <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                            <td
                              style={{
                                padding: "8px",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Accessories
                            </td>

                            {/* Invoice A */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                color: "#9ca3af",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              -
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                color: "#9ca3af",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              -
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggA.accessoriesTotal || 0)}
                            </td>

                            {/* Invoice B */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                color: "#9ca3af",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              -
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                color: "#9ca3af",
                                borderRight: "1px solid #e5e7eb",
                              }}
                            >
                              -
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              {formatINR(aggB.accessoriesTotal || 0)}
                            </td>

                            {/* Difference */}
                            <td
                              style={{
                                padding: "8px",
                                textAlign: "center",
                                fontWeight: "500",
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    getDifference(
                                      aggA.accessoriesTotal,
                                      aggB.accessoriesTotal,
                                    ) > 0
                                      ? "#059669"
                                      : getDifference(
                                            aggA.accessoriesTotal,
                                            aggB.accessoriesTotal,
                                          ) < 0
                                        ? "#dc2626"
                                        : "#4b5563",
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
                              </div>
                            </td>
                          </tr>

                          {/* Room Total */}
                          <tr style={{ backgroundColor: "#f9fafb" }}>
                            <td
                              style={{
                                padding: "12px",
                                fontWeight: "600",
                                color: "#1f2937",
                                borderRight: "2px solid #d1d5db",
                              }}
                            >
                              Room Total
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#1f2937",
                                borderRight: "2px solid #d1d5db",
                              }}
                              colSpan="3"
                            >
                              {formatINR(aggA.roomTotal)}
                            </td>
                            <td
                              style={{
                                padding: "12px",
                                textAlign: "center",
                                fontWeight: "600",
                                color: "#1f2937",
                                borderRight: "2px solid #d1d5db",
                              }}
                              colSpan="3"
                            >
                              {formatINR(aggB.roomTotal)}
                            </td>
                            <td
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color:
                                      roomDifference > 0
                                        ? "#059669"
                                        : roomDifference < 0
                                          ? "#dc2626"
                                          : "#1f2937",
                                  }}
                                >
                                  {roomDifference > 0 ? "+" : ""}
                                  {formatINR(Math.abs(roomDifference))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
            padding: "24px 40px",
            borderBottom: "1px solid #e5e7eb",
          }}
        >
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "16px",
            }}
          >
            ADDITIONAL SERVICES COMPARISON
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
                    fontSize: "14px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "16px",
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f9fafb" }}>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "left",
                          fontWeight: "500",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        Service
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "500",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {clientA.name}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "500",
                          borderBottom: "1px solid #e5e7eb",
                        }}
                      >
                        {clientB.name}
                      </th>
                      <th
                        style={{
                          padding: "12px",
                          textAlign: "right",
                          fontWeight: "500",
                          borderBottom: "1px solid #e5e7eb",
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
                    padding: "16px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                >
                  <span style={{ fontWeight: "500" }}>
                    Total Additional Services
                  </span>
                  <div style={{ display: "flex", gap: "32px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "#4b5563" }}>
                        {clientA.name}
                      </div>
                      <div style={{ fontWeight: "500" }}>
                        {formatINR(extrasTotalA)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "#4b5563" }}>
                        {clientB.name}
                      </div>
                      <div style={{ fontWeight: "500" }}>
                        {formatINR(extrasTotalB)}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "14px", color: "#4b5563" }}>
                        Difference
                      </div>
                      <div
                        style={{
                          fontWeight: "bold",
                          color:
                            extrasDifference > 0
                              ? "#059669"
                              : extrasDifference < 0
                                ? "#dc2626"
                                : "#1f2937",
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
      <div
        style={{
          padding: "24px 40px",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "bold",
            color: "#1f2937",
            marginBottom: "16px",
          }}
        >
          FINAL SUMMARY COMPARISON
        </h3>
        <table
          style={{
            width: "100%",
            fontSize: "14px",
            border: "1px solid #e5e7eb",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <th
                style={{
                  padding: "12px",
                  textAlign: "left",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Description
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {clientA.name}
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {clientB.name}
              </th>
              <th
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderBottom: "1px solid #e5e7eb",
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
            <tr style={{ backgroundColor: "#f9fafb" }}>
              <td
                style={{
                  padding: "12px",
                  fontWeight: "500",
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                Subtotal
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {formatINR(grandTotalA)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                {formatINR(grandTotalB)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "500",
                  borderTop: "1px solid #e5e7eb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <span
                  style={{
                    color:
                      getDifference(grandTotalA, grandTotalB) > 0
                        ? "#059669"
                        : getDifference(grandTotalA, grandTotalB) < 0
                          ? "#dc2626"
                          : "#1f2937",
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
            <tr style={{ borderTop: "2px solid #d1d5db" }}>
              <td
                style={{
                  padding: "12px",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                FINAL AMOUNT
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {formatINR(finalPayableA)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "bold",
                  color: "#1f2937",
                }}
              >
                {formatINR(finalPayableB)}
              </td>
              <td
                style={{
                  padding: "12px",
                  textAlign: "right",
                  fontWeight: "bold",
                  color:
                    totalDifference > 0
                      ? "#059669"
                      : totalDifference < 0
                        ? "#dc2626"
                        : "#1f2937",
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
          borderTop: "2px solid #1f2937",
          padding: "24px 40px",
          backgroundColor: "#f9fafb",
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
                fontWeight: "500",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Contact Details
            </h4>
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
                marginBottom: "4px",
              }}
            >
              9700360963 | 9866565057 | 9246893307 | 7799677762
            </p>
            <p
              style={{
                fontSize: "14px",
                color: "#4b5563",
              }}
            >
              industry.skanda@gmail.com
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <h4
              style={{
                fontWeight: "500",
                color: "#1f2937",
                marginBottom: "8px",
              }}
            >
              Report Notes
            </h4>
            <ul
              style={{
                fontSize: "14px",
                color: "#4b5563",
                padding: 0,
                margin: 0,
                listStyle: "none",
              }}
            >
              <li style={{ marginBottom: "4px" }}>
                • Differences shown as Invoice A - Invoice B
              </li>
              <li style={{ marginBottom: "4px" }}>
                • Positive values indicate Invoice A is higher
              </li>
              <li style={{ marginBottom: "4px" }}>
                • Negative values indicate Invoice B is higher
              </li>
              <li>• All amounts in Indian Rupees (INR)</li>
            </ul>
          </div>
        </div>
        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #e5e7eb",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              margin: 0,
            }}
          >
            This is an automated comparison report generated by Skanda
            Industries Invoice System
          </p>
          <p
            style={{
              fontSize: "12px",
              color: "#6b7280",
              marginTop: "4px",
              marginBottom: 0,
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

function DetailRow({ label, value, fullWidth = false }) {
  if (!value) return null;

  if (fullWidth) {
    return (
      <tr>
        <td colSpan="2" style={{ padding: "4px 0", fontSize: "14px" }}>
          <span style={{ fontWeight: "500" }}>{label}:</span> {value}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={{ padding: "4px 0", fontWeight: "500" }}>{label}</td>
      <td style={{ padding: "4px 0", textAlign: "right" }}>{value}</td>
    </tr>
  );
}

function SummaryCard({ label, valueA, valueB, highlight = false }) {
  const diff = getDifference(valueA, valueB);
  const diffClass = diff > 0 ? "#059669" : diff < 0 ? "#dc2626" : "#4b5563";

  return (
    <div
      style={{
        border: highlight ? "1px solid #d1d5db" : "1px solid #e5e7eb",
        borderRadius: "6px",
        padding: "12px",
      }}
    >
      <div
        style={{
          fontSize: "12px",
          color: "#4b5563",
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: "bold",
          color: diffClass,
        }}
      >
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </div>
      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginTop: "8px",
        }}
      >
        <div>A: {formatINR(valueA)}</div>
        <div>B: {formatINR(valueB)}</div>
      </div>
    </div>
  );
}

function ComparisonRow({
  label,
  valueA,
  valueB,
  isArea = false,
  isDiscount = false,
}) {
  const diff = getDifference(valueA, valueB);
  const diffClass = diff > 0 ? "#059669" : diff < 0 ? "#dc2626" : "#4b5563";

  const formatValue = (val) => {
    if (isArea) return `${val?.toFixed(2) || "0.00"}`;
    if (isDiscount && val > 0) return `- ${formatINR(val)}`;
    return formatINR(val || 0);
  };

  return (
    <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
      <td style={{ padding: "12px" }}>{label}</td>
      <td style={{ padding: "12px", textAlign: "right", fontWeight: "500" }}>
        {formatValue(valueA)}
      </td>
      <td style={{ padding: "12px", textAlign: "right", fontWeight: "500" }}>
        {formatValue(valueB)}
      </td>
      <td
        style={{
          padding: "12px",
          textAlign: "right",
          fontWeight: "500",
          color: diffClass,
        }}
      >
        {diff > 0 ? "+" : ""}
        {isArea
          ? `${Math.abs(diff)?.toFixed(2) || "0.00"}`
          : formatINR(Math.abs(diff))}
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

export default CompareInvoices;
export { InvoiceComparisonReport };
