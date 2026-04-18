import { useState, useEffect } from "react";
import api from "../api/api";
import { forwardRef } from "react";
import config from "../config.js";

/* -------------------------------
   CompareInvoicesT1 Component
--------------------------------*/

const CompareInvoicesT1 = forwardRef(
  ({ invoiceAId, invoiceBId, onLoadedA, onLoadedB, company }, ref) => {
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
        <div style={s.loadingContainer}>
          <div style={s.spinner}></div>
          <p style={s.loadingText}>Loading comparison report...</p>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }

    if (error) {
      return (
        <div style={s.errorContainer}>
          <p style={s.errorText}>{error}</p>
        </div>
      );
    }

    if (!invoiceA || !invoiceB) {
      return (
        <div style={s.emptyContainer}>
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
   Invoice Comparison Report Component
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

  const logoURL = company?.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
    : `${import.meta.env.VITE_API_BASE}/public/${config.platform.logoFile}`;

  const companyData = company || config.platform;

  return (
    <div ref={ref} id="invoice-comparison-report" style={s.root}>
      {/* Header */}
      <div style={s.headerWrapper}>
        <div style={s.headerTop}>
          <div style={s.headerMain}>
            <div style={s.headerLeft}>
              <h1 style={s.companyName}>{companyData.name}</h1>
              <p style={s.companyMeta}>
                {companyData.registeredOffice}
                {companyData.industryAddress && (
                  <>
                    <br />
                    {companyData.industryAddress}
                  </>
                )}
              </p>
              <p style={s.companyMeta}>
                {companyData.phones.join(" · ")} · {companyData.email}
              </p>
            </div>
            <div style={s.logoMonogram}>
              <img
                src={logoURL}
                alt=""
                style={s.logoImg}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              {!logoURL && (
                <span style={s.monogramFallback}>
                  {companyData.name?.charAt(0) || "A"}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Report Title */}
      <div style={s.reportTitleSection}>
        <div style={s.reportMeta}>
          <div style={s.metaLabel}>COMPARISON REPORT</div>
          <div style={s.metaValue}>
            {new Date().toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </div>
        </div>
        <h2 style={s.reportTitle}>INVOICE COMPARISON</h2>
      </div>

      {/* Total Difference Banner */}
      <div style={s.differenceBanner}>
        <div style={s.differenceLabel}>Total Difference</div>
        <div
          style={{
            ...s.differenceValue,
            color:
              totalDifference > 0
                ? "#059669"
                : totalDifference < 0
                  ? "#8b2518"
                  : "#1f1d1b",
          }}
        >
          {totalDifference > 0 ? "+" : ""}
          {formatINR(Math.abs(totalDifference))}
        </div>
        <div style={s.differenceMeta}>
          {percentageDifference}% · {roomsA.length} vs {roomsB.length} rooms
        </div>
      </div>

      {/* Invoice Details Side by Side */}
      <div style={s.sectionBlock}>
        <h3 style={s.sectionHeader}>INVOICE DETAILS</h3>
        <div style={s.twoColumnGrid}>
          {/* Invoice A */}
          <div style={s.invoiceCard}>
            <div style={s.invoiceCardHeader}>
              <h4 style={s.invoiceCardTitle}>INVOICE A</h4>
              <span style={s.invoiceTypeBadge}>
                {invoiceA.invoiceType || "Proforma"}
              </span>
            </div>
            <table style={s.detailTable}>
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
                <tr>
                  <td colSpan="2" style={s.detailDivider}></td>
                </tr>
                <tr>
                  <td style={s.detailTotalLabel}>Total Amount</td>
                  <td style={s.detailTotalValue}>{formatINR(finalPayableA)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Invoice B */}
          <div style={s.invoiceCard}>
            <div style={s.invoiceCardHeader}>
              <h4 style={s.invoiceCardTitle}>INVOICE B</h4>
              <span style={s.invoiceTypeBadge}>
                {invoiceB.invoiceType || "Proforma"}
              </span>
            </div>
            <table style={s.detailTable}>
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
                <tr>
                  <td colSpan="2" style={s.detailDivider}></td>
                </tr>
                <tr>
                  <td style={s.detailTotalLabel}>Total Amount</td>
                  <td style={s.detailTotalValue}>{formatINR(finalPayableB)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick Comparison Summary */}
      <div style={s.sectionBlock}>
        <h3 style={s.sectionHeader}>QUICK COMPARISON</h3>
        <div style={s.quickCompareGrid}>
          <SummaryCard
            label="Rooms Difference"
            valueA={roomsTotalA}
            valueB={roomsTotalB}
            clientAName={clientA.name}
            clientBName={clientB.name}
          />
          <SummaryCard
            label="Extras Difference"
            valueA={extrasTotalA}
            valueB={extrasTotalB}
            clientAName={clientA.name}
            clientBName={clientB.name}
          />
          <SummaryCard
            label="Discount Difference"
            valueA={discountA}
            valueB={discountB}
            clientAName={clientA.name}
            clientBName={clientB.name}
            isDiscount
          />
          <SummaryCard
            label="Total Difference"
            valueA={finalPayableA}
            valueB={finalPayableB}
            clientAName={clientA.name}
            clientBName={clientB.name}
            highlight
          />
        </div>
      </div>

      {/* Pricing Comparison */}
      <div style={s.sectionBlock}>
        <h3 style={s.sectionHeader}>PRICING COMPARISON</h3>
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
                <th style={s.th}>RATE TYPE</th>
                <th style={s.thRight}>{clientA.name}</th>
                <th style={s.thRight}>{clientB.name}</th>
                <th style={s.thRight}>DIFFERENCE</th>
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
      </div>

      {/* Roomwise Comparison */}
      {(roomsA.length > 0 || roomsB.length > 0) && (
        <div style={s.sectionBlock}>
          <div style={s.sectionHeaderWithMeta}>
            <h3 style={s.sectionHeader}>ROOM WISE COMPARISON</h3>
            <span style={s.sectionMeta}>
              {roomsA.length} vs {roomsB.length} rooms
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
                <div key={idx} style={s.roomCard}>
                  {/* Room Header */}
                  <div style={s.roomCardHeader}>
                    <div>
                      <span style={s.roomNumber}>Room {idx + 1}</span>
                      <span style={s.roomNameText}>
                        {roomA.name || roomB.name || "Unnamed Room"}
                      </span>
                      {(roomA.description || roomB.description) && (
                        <span style={s.roomDescription}>
                          ({roomA.description || roomB.description})
                        </span>
                      )}
                    </div>
                    <div style={s.roomDifference}>
                      <div style={s.roomDifferenceLabel}>Difference</div>
                      <div
                        style={{
                          ...s.roomDifferenceValue,
                          color:
                            roomDifference > 0
                              ? "#059669"
                              : roomDifference < 0
                                ? "#8b2518"
                                : "#5c564e",
                        }}
                      >
                        {roomDifference > 0 ? "+" : ""}
                        {formatINR(Math.abs(roomDifference))}
                      </div>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div id="hello" style={s.tableWrapper}>
                    <table style={s.table}>
                      <colgroup>
                        <col style={{ width: "20%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "13%" }} />
                        <col style={{ width: "15%" }} />
                      </colgroup>
                      <thead>
                        <tr style={s.tableHeader}>
                          <th style={s.th}>ITEM</th>
                          <th style={s.thRight} colSpan="3">
                            {clientA.name}
                          </th>
                          <th style={s.thRight} colSpan="3">
                            {clientB.name}
                          </th>
                        </tr>
                        <tr style={s.tableSubHeader}>
                          <th style={s.th}></th>
                          <th style={s.thRight}>RATE</th>
                          <th style={s.thRight}>AREA</th>
                          <th style={s.thRight}>AMOUNT</th>
                          <th style={s.thRight}>RATE</th>
                          <th style={s.thRight}>AREA</th>
                          <th style={s.thRight}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Frame Work */}
                        <tr style={idx % 2 === 0 ? s.rowEven : s.rowOdd}>
                          <td style={s.td}>Frame Work</td>
                          <td style={s.tdRight}>{formatINR(roomFrameRateA)}</td>
                          <td style={s.tdRight}>
                            {aggA.frameAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>
                            {formatINR(aggA.framePriceTotal || 0)}
                          </td>
                          <td style={s.tdRight}>{formatINR(roomFrameRateB)}</td>
                          <td style={s.tdRight}>
                            {aggB.frameAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>
                            {formatINR(aggB.framePriceTotal || 0)}
                          </td>
                        </tr>

                        {/* Box Work */}
                        <tr style={idx % 2 === 0 ? s.rowOdd : s.rowEven}>
                          <td style={s.td}>Box Work</td>
                          <td style={s.tdRight}>{formatINR(roomBoxRateA)}</td>
                          <td style={s.tdRight}>
                            {aggA.boxAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>
                            {formatINR(aggA.boxPriceTotal || 0)}
                          </td>
                          <td style={s.tdRight}>{formatINR(roomBoxRateB)}</td>
                          <td style={s.tdRight}>
                            {aggB.boxAreaTotal?.toFixed(2) || "0.00"}
                          </td>
                          <td style={s.tdRight}>
                            {formatINR(aggB.boxPriceTotal || 0)}
                          </td>
                        </tr>

                        {/* Accessories */}
                        <tr style={idx % 2 === 0 ? s.rowEven : s.rowOdd}>
                          <td style={s.td}>Accessories</td>
                          <td style={s.tdRightMuted}>—</td>
                          <td style={s.tdRightMuted}>—</td>
                          <td style={s.tdRight}>
                            {formatINR(aggA.accessoriesTotal || 0)}
                          </td>
                          <td style={s.tdRightMuted}>—</td>
                          <td style={s.tdRightMuted}>—</td>
                          <td style={s.tdRight}>
                            {formatINR(aggB.accessoriesTotal || 0)}
                          </td>
                        </tr>

                        {/* Room Total */}
                        <tr style={s.roomTotalRow}>
                          <td style={s.tdBold}>Room Total</td>
                          <td style={s.tdRight} colSpan="3">
                            <span style={s.tdBold}>
                              {formatINR(aggA.roomTotal)}
                            </span>
                          </td>
                          <td style={s.tdRight} colSpan="3">
                            <span style={s.tdBold}>
                              {formatINR(aggB.roomTotal)}
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
        </div>
      )}

      {/* Extras Comparison */}
      {(extrasA.length > 0 || extrasB.length > 0) && (
        <div style={s.sectionBlock}>
          <h3 style={s.sectionHeader}>ADDITIONAL SERVICES</h3>
          {(() => {
            const allExtras = [
              ...new Set([
                ...extrasA.map((e) => e.label || "Service"),
                ...extrasB.map((e) => e.label || "Service"),
              ]),
            ];

            return (
              <>
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
                        <th style={s.th}>SERVICE</th>
                        <th style={s.thRight}>{clientA.name}</th>
                        <th style={s.thRight}>{clientB.name}</th>
                        <th style={s.thRight}>DIFFERENCE</th>
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
                            rowIndex={idx}
                          />
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={s.extrasSummary}>
                  <span style={s.extrasSummaryLabel}>
                    Total Additional Services
                  </span>
                  <div style={s.extrasSummaryValues}>
                    <div style={s.extrasSummaryItem}>
                      <span style={s.extrasSummaryClient}>{clientA.name}</span>
                      <span style={s.extrasSummaryAmount}>
                        {formatINR(extrasTotalA)}
                      </span>
                    </div>
                    <div style={s.extrasSummaryItem}>
                      <span style={s.extrasSummaryClient}>{clientB.name}</span>
                      <span style={s.extrasSummaryAmount}>
                        {formatINR(extrasTotalB)}
                      </span>
                    </div>
                    <div style={s.extrasSummaryItem}>
                      <span style={s.extrasSummaryClient}>Difference</span>
                      <span
                        style={{
                          ...s.extrasSummaryAmount,
                          color:
                            extrasDifference > 0
                              ? "#059669"
                              : extrasDifference < 0
                                ? "#8b2518"
                                : "#1f1d1b",
                        }}
                      >
                        {extrasDifference > 0 ? "+" : ""}
                        {formatINR(Math.abs(extrasDifference))}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* Final Summary */}
      <div style={s.sectionBlock}>
        <h3 style={s.sectionHeader}>FINAL SUMMARY</h3>
        <div style={s.summaryWrapper}>
          <table style={s.summaryTable}>
            <colgroup>
              <col style={{ width: "40%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <tbody>
              <tr>
                <td style={s.summaryLabel}>Rooms Total</td>
                <td style={s.summaryValue}>{formatINR(roomsTotalA)}</td>
                <td style={s.summaryValue}>{formatINR(roomsTotalB)}</td>
                <td
                  style={{
                    ...s.summaryValue,
                    color:
                      getDifference(roomsTotalA, roomsTotalB) > 0
                        ? "#059669"
                        : getDifference(roomsTotalA, roomsTotalB) < 0
                          ? "#8b2518"
                          : "#1f1d1b",
                  }}
                >
                  {getDifference(roomsTotalA, roomsTotalB) > 0 ? "+" : ""}
                  {formatINR(Math.abs(getDifference(roomsTotalA, roomsTotalB)))}
                </td>
              </tr>
              <tr>
                <td style={s.summaryLabel}>Additional Services</td>
                <td style={s.summaryValue}>{formatINR(extrasTotalA)}</td>
                <td style={s.summaryValue}>{formatINR(extrasTotalB)}</td>
                <td
                  style={{
                    ...s.summaryValue,
                    color:
                      extrasDifference > 0
                        ? "#059669"
                        : extrasDifference < 0
                          ? "#8b2518"
                          : "#1f1d1b",
                  }}
                >
                  {extrasDifference > 0 ? "+" : ""}
                  {formatINR(Math.abs(extrasDifference))}
                </td>
              </tr>
              <tr style={s.summaryDivider}>
                <td style={s.summarySubtotalLabel}>Subtotal</td>
                <td style={s.summarySubtotalValue}>{formatINR(grandTotalA)}</td>
                <td style={s.summarySubtotalValue}>{formatINR(grandTotalB)}</td>
                <td
                  style={{
                    ...s.summarySubtotalValue,
                    color:
                      getDifference(grandTotalA, grandTotalB) > 0
                        ? "#059669"
                        : getDifference(grandTotalA, grandTotalB) < 0
                          ? "#8b2518"
                          : "#1f1d1b",
                  }}
                >
                  {getDifference(grandTotalA, grandTotalB) > 0 ? "+" : ""}
                  {formatINR(Math.abs(getDifference(grandTotalA, grandTotalB)))}
                </td>
              </tr>
              <tr>
                <td style={s.summaryDiscountLabel}>Discount</td>
                <td style={s.summaryDiscountValue}>
                  {discountA > 0 ? `− ${formatINR(discountA)}` : "—"}
                </td>
                <td style={s.summaryDiscountValue}>
                  {discountB > 0 ? `− ${formatINR(discountB)}` : "—"}
                </td>
                <td style={s.summaryDiscountValue}>
                  {getDifference(discountA, discountB) !== 0 ? (
                    <span
                      style={{
                        color:
                          getDifference(discountA, discountB) > 0
                            ? "#059669"
                            : "#8b2518",
                      }}
                    >
                      {getDifference(discountA, discountB) > 0 ? "+" : ""}
                      {formatINR(Math.abs(getDifference(discountA, discountB)))}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
              <tr style={s.finalRow}>
                <td style={s.finalLabel}>FINAL AMOUNT</td>
                <td style={s.finalValue}>{formatINR(finalPayableA)}</td>
                <td style={s.finalValue}>{formatINR(finalPayableB)}</td>
                <td
                  style={{
                    ...s.finalValue,
                    color:
                      totalDifference > 0
                        ? "#059669"
                        : totalDifference < 0
                          ? "#8b2518"
                          : "#1f1d1b",
                  }}
                >
                  {totalDifference > 0 ? "+" : ""}
                  {formatINR(Math.abs(totalDifference))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <div style={s.footerLabel}>Contact Details</div>
            <p style={s.footerText}>{companyData.phones.join(" · ")}</p>
            <p style={s.footerText}>{companyData.email}</p>
          </div>
          <div>
            <div style={s.footerLabel}>Report Notes</div>
            <ul style={s.notesList}>
              <li style={s.notesItem}>
                <span style={s.notesNumber}>01</span>
                <span>Differences shown as Invoice A - Invoice B</span>
              </li>
              <li style={s.notesItem}>
                <span style={s.notesNumber}>02</span>
                <span>Positive values indicate Invoice A is higher</span>
              </li>
              <li style={s.notesItem}>
                <span style={s.notesNumber}>03</span>
                <span>Negative values indicate Invoice B is higher</span>
              </li>
              <li style={s.notesItem}>
                <span style={s.notesNumber}>04</span>
                <span>All amounts in Indian Rupees (INR)</span>
              </li>
            </ul>
          </div>
        </div>
        <div style={s.footerBottom}>
          <p style={s.footerMeta}>
            Automated comparison report · {companyData.name} Invoice System
          </p>
          <p style={s.footerReportId}>
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
        <td colSpan="2" style={s.detailFullRow}>
          <span style={s.detailFullLabel}>{label}:</span> {value}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td style={s.detailLabel}>{label}</td>
      <td style={s.detailValue}>{value}</td>
    </tr>
  );
}

function SummaryCard({
  label,
  valueA,
  valueB,
  clientAName,
  clientBName,
  highlight = false,
  isDiscount = false,
}) {
  const diff = getDifference(valueA, valueB);
  const diffColor = diff > 0 ? "#059669" : diff < 0 ? "#8b2518" : "#5c564e";

  return (
    <div
      style={{
        ...s.summaryCard,
        borderLeft: highlight ? "3px solid #a07c3a" : "1px solid #e4dccc",
      }}
    >
      <div style={s.summaryCardLabel}>{label}</div>
      <div style={{ ...s.summaryCardDiff, color: diffColor }}>
        {diff > 0 ? "+" : ""}
        {formatINR(Math.abs(diff))}
      </div>
      <div style={s.summaryCardDetails}>
        <div style={s.summaryCardClient}>
          <span>A ({clientAName?.split(" ")[0] || "A"}):</span>
          <span>
            {isDiscount && valueA > 0
              ? `− ${formatINR(valueA)}`
              : formatINR(valueA)}
          </span>
        </div>
        <div style={s.summaryCardClient}>
          <span>B ({clientBName?.split(" ")[0] || "B"}):</span>
          <span>
            {isDiscount && valueB > 0
              ? `− ${formatINR(valueB)}`
              : formatINR(valueB)}
          </span>
        </div>
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
  rowIndex = 0,
}) {
  const diff = getDifference(valueA, valueB);
  const diffColor = diff > 0 ? "#059669" : diff < 0 ? "#8b2518" : "#5c564e";

  const formatValue = (val) => {
    if (isArea) return `${val?.toFixed(2) || "0.00"}`;
    if (isDiscount && val > 0) return `− ${formatINR(val)}`;
    return formatINR(val || 0);
  };

  return (
    <tr style={rowIndex % 2 === 0 ? s.rowEven : s.rowOdd}>
      <td style={s.td}>{label}</td>
      <td style={s.tdRight}>{formatValue(valueA)}</td>
      <td style={s.tdRight}>{formatValue(valueB)}</td>
      <td style={{ ...s.tdRight, color: diffColor }}>
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

/* -------------------------------
   Styles - Editorial Design
--------------------------------*/

const s = {
  // Root
  root: {
    backgroundColor: "#faf7f0",
    padding: "48px 40px",
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

  // Loading states
  loadingContainer: {
    textAlign: "center",
    padding: "48px 0",
    backgroundColor: "#faf7f0",
  },
  spinner: {
    display: "inline-block",
    animation: "spin 1s linear infinite",
    borderRadius: "50%",
    height: "32px",
    width: "32px",
    borderBottom: "2px solid #a07c3a",
  },
  loadingText: {
    marginTop: "16px",
    color: "#5c564e",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
  },
  errorContainer: {
    textAlign: "center",
    padding: "48px 0",
    color: "#8b2518",
    backgroundColor: "#faf7f0",
  },
  errorText: {
    fontSize: "12px",
  },
  emptyContainer: {
    textAlign: "center",
    padding: "48px 0",
    color: "#5c564e",
    fontSize: "12px",
    backgroundColor: "#faf7f0",
  },

  // Header
  headerWrapper: {
    marginBottom: "32px",
  },
  headerTop: {
    borderTop: "2px solid #a89d8c",
    borderBottom: "1px solid #a89d8c",
    padding: "24px 0",
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
    fontSize: "36px",
    fontWeight: "400",
    letterSpacing: "-0.01em",
    color: "#1f1d1b",
    margin: "0 0 8px 0",
    lineHeight: "1.1",
  },
  companyMeta: {
    fontSize: "10px",
    color: "#5c564e",
    lineHeight: "1.6",
    margin: 0,
    fontWeight: "300",
  },
  logoMonogram: {
    width: "56px",
    height: "56px",
    border: "1.5px solid #a07c3a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    flexShrink: 0,
  },
  logoImg: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  monogramFallback: {
    fontFamily: '"Georgia", serif',
    fontSize: "24px",
    color: "#a07c3a",
    fontWeight: "400",
  },

  // Report Title
  reportTitleSection: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "24px",
    paddingBottom: "16px",
    borderBottom: "1px solid #a89d8c",
  },
  reportMeta: {
    textAlign: "left",
  },
  metaLabel: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#5c564e",
    fontWeight: "500",
    marginBottom: "2px",
  },
  metaValue: {
    fontSize: "12px",
    color: "#1f1d1b",
    fontWeight: "400",
  },
  reportTitle: {
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "36px",
    fontWeight: "400",
    letterSpacing: "0.05em",
    color: "#1f1d1b",
    textAlign: "right",
    margin: 0,
    lineHeight: "1",
  },

  // Difference Banner
  differenceBanner: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4dccc",
    padding: "20px 28px",
    marginBottom: "40px",
    display: "flex",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  differenceLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#5c564e",
    fontWeight: "500",
  },
  differenceValue: {
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "32px",
    fontWeight: "400",
  },
  differenceMeta: {
    fontSize: "11px",
    color: "#5c564e",
  },

  // Sections
  sectionBlock: {
    marginBottom: "40px",
  },
  sectionHeader: {
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "18px",
    fontWeight: "400",
    color: "#1f1d1b",
    margin: "0 0 0px 0",
    paddingBottom: "8px",
    borderBottom: "0px solid #a07c3a",
  },
  sectionHeaderWithMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "20px",
    paddingBottom: "8px",
    borderBottom: "1px solid #a07c3a",
  },
  sectionMeta: {
    fontSize: "11px",
    color: "#5c564e",
  },

  // Two Column Grid
  twoColumnGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "24px",
  },

  // Invoice Cards
  invoiceCard: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4dccc",
    padding: "20px",
  },
  invoiceCardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    paddingBottom: "12px",
    borderBottom: "1px solid #e4dccc",
  },
  invoiceCardTitle: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1f1d1b",
    margin: 0,
    letterSpacing: "0.05em",
  },
  invoiceTypeBadge: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#a07c3a",
    fontWeight: "500",
  },
  detailTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  detailLabel: {
    padding: "6px 0",
    fontSize: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
    fontWeight: "500",
  },
  detailValue: {
    padding: "6px 0",
    fontSize: "11px",
    color: "#1f1d1b",
    textAlign: "right",
  },
  detailFullRow: {
    padding: "6px 0",
    fontSize: "11px",
    color: "#1f1d1b",
  },
  detailFullLabel: {
    fontWeight: "500",
    color: "#5c564e",
  },
  detailDivider: {
    padding: 0,
    borderTop: "1px solid #e4dccc",
  },
  detailTotalLabel: {
    padding: "10px 0 0 0",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
    fontWeight: "600",
  },
  detailTotalValue: {
    padding: "10px 0 0 0",
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "16px",
    color: "#1f1d1b",
    textAlign: "right",
    fontWeight: "400",
  },

  // Quick Compare Grid
  quickCompareGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr",
    gap: "16px",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    padding: "16px",
    border: "1px solid #e4dccc",
  },
  summaryCardLabel: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
    marginBottom: "8px",
    fontWeight: "500",
  },
  summaryCardDiff: {
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "20px",
    fontWeight: "400",
    marginBottom: "12px",
  },
  summaryCardDetails: {
    borderTop: "0.5px solid #e4dccc",
    paddingTop: "10px",
  },
  summaryCardClient: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "10px",
    color: "#5c564e",
    marginBottom: "4px",
  },

  // Tables
  tableWrapper: {
    border: "1px solid #e4dccc",
    overflow: "auto",
    marginBottom: "0px",
    backgroundColor: "#ffffff",
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
  tableSubHeader: {
    borderBottom: "1px solid #e4dccc",
    backgroundColor: "#faf7f0",
  },
  th: {
    padding: "12px 10px",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#5c564e",
    fontWeight: "500",
    textAlign: "left",
  },
  thRight: {
    padding: "12px 10px",
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#5c564e",
    fontWeight: "500",
    textAlign: "right",
  },
  td: {
    padding: "10px 10px",
    fontSize: "11px",
    color: "#1f1d1b",
    fontWeight: "300",
    borderBottom: "1px solid #f0ebe0",
  },
  tdRight: {
    padding: "10px 10px",
    fontSize: "11px",
    color: "#1f1d1b",
    fontWeight: "300",
    textAlign: "right",
    borderBottom: "1px solid #f0ebe0",
    fontVariantNumeric: "tabular-nums",
  },
  tdRightMuted: {
    padding: "10px 10px",
    fontSize: "11px",
    color: "#a89d8c",
    textAlign: "right",
    borderBottom: "1px solid #f0ebe0",
  },
  tdBold: {
    padding: "10px 10px",
    fontSize: "11px",
    color: "#1f1d1b",
    fontWeight: "600",
  },
  rowEven: {
    backgroundColor: "#ffffff",
  },
  rowOdd: {
    backgroundColor: "#faf7f0",
  },

  // Room Cards
  roomCard: {
    marginBottom: "24px",
    border: "1px solid #e4dccc",
    backgroundColor: "#ffffff",
  },
  roomCardHeader: {
    padding: "16px 20px",
    backgroundColor: "#faf7f0",
    borderBottom: "1px solid #e4dccc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  roomNumber: {
    fontSize: "11px",
    fontWeight: "600",
    color: "#a07c3a",
    marginRight: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  roomNameText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1f1d1b",
  },
  roomDifference: {
    textAlign: "right",
  },
  roomDifferenceLabel: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
  },
  roomDifferenceValue: {
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "16px",
    fontWeight: "400",
  },
  roomDescription: {
    padding: "12px 20px",
    fontSize: "10px",
    color: "#5c564e",
    fontStyle: "italic",
    borderBottom: "0px solid #e4dccc",
  },
  roomTotalRow: {
    backgroundColor: "#faf7f0",
    borderTop: "1px solid #a89d8c",
  },

  // Extras Summary
  extrasSummary: {
    backgroundColor: "#faf7f0",
    border: "1px solid #e4dccc",
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  extrasSummaryLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
    fontWeight: "500",
  },
  extrasSummaryValues: {
    display: "flex",
    gap: "32px",
  },
  extrasSummaryItem: {
    textAlign: "right",
  },
  extrasSummaryClient: {
    fontSize: "9px",
    color: "#5c564e",
    marginRight: "12px",
  },
  extrasSummaryAmount: {
    fontSize: "13px",
    fontWeight: "500",
    fontVariantNumeric: "tabular-nums",
  },

  // Summary Table
  summaryWrapper: {
    backgroundColor: "#ffffff",
    border: "1px solid #e4dccc",
    padding: "20px",
  },
  summaryTable: {
    width: "100%",
    borderCollapse: "collapse",
  },
  summaryLabel: {
    padding: "8px 0",
    fontSize: "11px",
    color: "#5c564e",
  },
  summaryValue: {
    padding: "8px 0",
    fontSize: "12px",
    color: "#1f1d1b",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  summaryDivider: {
    borderTop: "1px solid #e4dccc",
  },
  summarySubtotalLabel: {
    padding: "12px 0 8px 0",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#5c564e",
    fontWeight: "500",
  },
  summarySubtotalValue: {
    padding: "12px 0 8px 0",
    fontSize: "13px",
    color: "#1f1d1b",
    textAlign: "right",
    fontWeight: "500",
    fontVariantNumeric: "tabular-nums",
  },
  summaryDiscountLabel: {
    padding: "6px 0",
    fontSize: "11px",
    color: "#8b2518",
  },
  summaryDiscountValue: {
    padding: "6px 0",
    fontSize: "12px",
    color: "#8b2518",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums",
  },
  finalRow: {
    borderTop: "1px solid #a89d8c",
  },
  finalLabel: {
    padding: "16px 0 8px 0",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    color: "#5c564e",
    fontWeight: "600",
  },
  finalValue: {
    padding: "16px 0 8px 0",
    fontFamily: '"Georgia", "Cormorant Garamond", serif',
    fontSize: "18px",
    color: "#1f1d1b",
    textAlign: "right",
    fontWeight: "400",
    fontVariantNumeric: "tabular-nums",
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
  notesList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  notesItem: {
    fontSize: "10px",
    color: "#5c564e",
    marginBottom: "8px",
    display: "flex",
    gap: "12px",
    lineHeight: "1.5",
  },
  notesNumber: {
    color: "#a07c3a",
    flexShrink: 0,
    fontWeight: "600",
    minWidth: "20px",
  },
  footerBottom: {
    marginTop: "28px",
    paddingTop: "20px",
    borderTop: "0.5px solid #e4dccc",
    textAlign: "center",
  },
  footerMeta: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: "#a89d8c",
    margin: 0,
  },
  footerReportId: {
    fontSize: "9px",
    color: "#a89d8c",
    marginTop: "6px",
    marginBottom: 0,
  },
};

export default CompareInvoicesT1;
export { InvoiceComparisonReport };
