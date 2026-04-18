// src/components/ClientInvoiceT2.jsx
import { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoiceT2 = forwardRef(({ invoice, company }, ref) => {
  if (!invoice) return null;

  const client = invoice.client || {};
  const rooms = Array.isArray(invoice.rooms) ? invoice.rooms : [];
  const extras = Array.isArray(invoice.extras) ? invoice.extras : [];
  const pricing = invoice.pricing || {};
  const discount = Number(invoice.discount || 0);
  const finalPayableFromApi = Number(invoice.finalPayable || 0);

  const frameworkRate = typeof pricing.frameRate === "number" ? pricing.frameRate : 0;
  const boxRate = typeof pricing.boxRate === "number" ? pricing.boxRate : frameworkRate * 1.4;

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
    let frameAreaTotal = 0, boxAreaTotal = 0, framePriceTotal = 0, boxPriceTotal = 0;
    items.forEach((item) => {
      frameAreaTotal += Number(item.frame?.area || 0);
      boxAreaTotal += Number(item.box?.area || 0);
      framePriceTotal += Number(item.frame?.price || 0);
      boxPriceTotal += Number(item.box?.price || 0);
    });
    const accessoriesTotal = accessories.reduce((sum, a) => sum + Number(a.price || 0) * Number(a.qty || 0), 0);
    const itemsTotal = framePriceTotal + boxPriceTotal;
    return { frameAreaTotal, boxAreaTotal, framePriceTotal, boxPriceTotal, accessoriesTotal, itemsTotal, roomTotal: itemsTotal + accessoriesTotal, accessories };
  };

  const roomsTotals = rooms.map((room) => calcRoomAggregates(room));
  const roomsTotal = roomsTotals.reduce((sum, r) => sum + r.roomTotal, 0);
  const extrasTotal = extras.reduce((sum, ex) => sum + Number(ex.total || 0), 0);
  const grandTotal = typeof invoice.grandTotal === "number" ? invoice.grandTotal : roomsTotal + extrasTotal;
  const safeDiscount = Math.min(discount, grandTotal);
  const finalPayable = finalPayableFromApi > 0 ? finalPayableFromApi : grandTotal - safeDiscount;

  const invoiceDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "";
  const invoiceIdShort = invoice._id ? `INV-${String(invoice._id).slice(-6).toUpperCase()}` : "";

  const s = {
    root: { backgroundColor: "#ffffff", padding: "0", fontSize: "12px", color: "#000000", width: "800px", fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" },
    headerBand: { backgroundColor: "#0f172a", padding: "16px" },
    companyName: { fontSize: "22px", fontWeight: "700", margin: 0, color: "#ffffff" },
    companyInfo: { fontSize: "10px", color: "#cbd5e1", marginTop: "4px", margin: 0 },
    infoLabel: { fontWeight: "500", color: "#fbbf24" },
    body: { padding: "16px" },
    sectionTitle: { fontSize: "13px", fontWeight: "700", marginBottom: "8px", marginTop: "16px", borderBottom: "2px solid #d97706", paddingBottom: "4px", color: "#0f172a" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "8px" },
    theadAmber: { backgroundColor: "#d97706" },
    theadNavy: { backgroundColor: "#1e293b" },
    thSection: { padding: "6px", textAlign: "left", fontWeight: "700", border: "1px solid #92400e", color: "#ffffff" },
    thCol: { padding: "4px", border: "1px solid #334155", textAlign: "left", fontWeight: "500", color: "#ffffff" },
    thColRight: { padding: "4px", border: "1px solid #334155", textAlign: "right", fontWeight: "500", color: "#ffffff" },
    tdLabel: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
    tdValue: { padding: "6px", border: "1px solid #e2e8f0" },
    tdLeft: { padding: "4px", border: "1px solid #e2e8f0" },
    tdRight: { padding: "4px", border: "1px solid #e2e8f0", textAlign: "right" },
    tdBold: { padding: "4px", border: "1px solid #e2e8f0", fontWeight: "700" },
    tdBoldRight: { padding: "4px", border: "1px solid #e2e8f0", fontWeight: "700", textAlign: "right" },
    rowEven: { backgroundColor: "#ffffff" },
    rowOdd: { backgroundColor: "#f8fafc" },
    subtotalRow: { backgroundColor: "#1e293b" },
    subtotalLabel: { padding: "4px", border: "1px solid #334155", fontWeight: "700", color: "#ffffff" },
    subtotalValue: { padding: "4px", border: "1px solid #334155", fontWeight: "700", textAlign: "right", color: "#ffffff" },
    summaryFinal: {
      label: { padding: "6px", border: "1px solid #0f172a", fontWeight: "700", backgroundColor: "#0f172a", color: "#ffffff" },
      value: { padding: "6px", border: "1px solid #0f172a", textAlign: "right", fontWeight: "700", fontSize: "15px", backgroundColor: "#0f172a", color: "#ffffff" },
    },
    summaryGray: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", backgroundColor: "#f8fafc" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", backgroundColor: "#f8fafc" },
    },
    summaryPlain: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right" },
    },
    summaryDiscount: {
      label: { padding: "6px", border: "1px solid #e2e8f0", fontWeight: "500", color: "#dc2626" },
      value: { padding: "6px", border: "1px solid #e2e8f0", textAlign: "right", color: "#dc2626" },
    },
    footer: { borderTop: "3px solid #0f172a", padding: "12px 16px", fontSize: "10px", color: "#4b5563", marginTop: "8px" },
    footerGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
    footerLabel: { fontWeight: "500", color: "#0f172a", marginBottom: "4px" },
  };

  const logoURL = company?.logoFile ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}` : null;

  return (
    <div ref={ref} style={s.root}>
      {/* Navy header band */}
      <div style={s.headerBand}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {logoURL && (
            <div style={{ width: "56px", height: "56px", flexShrink: 0, backgroundColor: "#ffffff", borderRadius: "6px", padding: "4px" }}>
              <img src={logoURL} alt={company?.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          )}
          <div>
            <h1 style={s.companyName}>{company?.name}</h1>
            <p style={s.companyInfo}><span style={s.infoLabel}>Regd Office:</span> {company?.registeredOffice}</p>
            {company?.industryAddress && <p style={s.companyInfo}><span style={s.infoLabel}>Industry:</span> {company.industryAddress}</p>}
            <p style={s.companyInfo}><span style={s.infoLabel}>Contact:</span> {company?.phones?.join(", ")} | <span style={s.infoLabel}>Email:</span> {company?.email}</p>
          </div>
        </div>
      </div>

      <div style={s.body}>
        {/* Client & Invoice Details */}
        <div style={s.sectionTitle}>CLIENT &amp; INVOICE DETAILS</div>
        <table style={s.table}>
          <tbody>
            <tr>
              <td style={s.tdLabel} width="25%">Client Name</td>
              <td style={s.tdValue} width="25%">
                {client.name || "—"}
                {invoice.invoiceType && <span style={{ marginLeft: "4px", fontSize: "10px", color: "#64748b" }}>({invoice.invoiceType})</span>}
              </td>
              <td style={s.tdLabel} width="25%">Invoice No</td>
              <td style={{ ...s.tdValue, fontWeight: "600" }} width="25%">{invoiceIdShort || "—"}</td>
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
            {client.siteMapLink && (
              <tr>
                <td style={s.tdLabel}>Location Map</td>
                <td colSpan="3" style={s.tdValue}>
                  <a href={client.siteMapLink} target="_blank" rel="noreferrer" style={{ color: "#374151", textDecoration: "underline" }}>
                    {client.siteMapLink.length > 60 ? client.siteMapLink.substring(0, 60) + "..." : client.siteMapLink}
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pricing Rates */}
        <div style={s.sectionTitle}>PRICING RATES (per sqft)</div>
        <table style={s.table}>
          <thead>
            <tr style={s.theadNavy}>
              <th style={s.thCol}>Frame Rate</th>
              <th style={s.thCol}>Box Rate</th>
              <th style={s.thCol}>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.tdLeft}>{frameworkRate ? formatINR(frameworkRate) : "—"}</td>
              <td style={s.tdLeft}>{boxRate ? formatINR(boxRate) : frameworkRate ? formatINR(frameworkRate * 1.4) : "—"}</td>
              <td style={{ ...s.tdLeft, fontSize: "10px", color: "#64748b" }}>Room-specific prices may vary.</td>
            </tr>
          </tbody>
        </table>

        {/* Rooms */}
        {rooms.length > 0 && (
          <>
            <div style={s.sectionTitle}>ROOMWISE BREAKDOWN</div>
            {rooms.map((room, idx) => {
              const agg = roomsTotals[idx] || {};
              const roomFrameRate = typeof room.frameRate === "number" && !Number.isNaN(room.frameRate) ? room.frameRate : frameworkRate || 0;
              const roomBoxRate = typeof room.boxRate === "number" && !Number.isNaN(room.boxRate) ? room.boxRate : boxRate || roomFrameRate * 1.4;
              return (
                <div key={idx} style={{ marginBottom: "12px" }}>
                  <div style={{ backgroundColor: "#0f172a", padding: "5px 8px", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "700", fontSize: "11px", color: "#ffffff" }}>{room.name}</span>
                    {room.description && <span style={{ fontSize: "10px", color: "#94a3b8", marginLeft: "8px" }}>— {room.description}</span>}
                  </div>
                  <table style={s.table}>
                    <thead>
                      <tr style={s.theadNavy}>
                        <th style={s.thCol} width="40%">Description</th>
                        <th style={s.thColRight} width="20%">Area (sq.ft)</th>
                        <th style={s.thColRight} width="20%">Rate</th>
                        <th style={s.thColRight} width="20%">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={s.rowEven}>
                        <td style={s.tdLeft}>Frame Work</td>
                        <td style={s.tdRight}>{agg.frameAreaTotal?.toFixed(2) || "0.00"}</td>
                        <td style={s.tdRight}>{formatINR(roomFrameRate)}</td>
                        <td style={s.tdRight}>{formatINR(agg.framePriceTotal || 0)}</td>
                      </tr>
                      <tr style={s.rowOdd}>
                        <td style={s.tdLeft}>Box Work</td>
                        <td style={s.tdRight}>{agg.boxAreaTotal?.toFixed(2) || "0.00"}</td>
                        <td style={s.tdRight}>{formatINR(roomBoxRate)}</td>
                        <td style={s.tdRight}>{formatINR(agg.boxPriceTotal || 0)}</td>
                      </tr>
                      <tr style={s.subtotalRow}>
                        <td style={s.subtotalLabel} colSpan="3">Room Items Subtotal</td>
                        <td style={s.subtotalValue}>{formatINR(agg.itemsTotal || 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {agg.accessories?.length > 0 && (
                    <table style={s.table}>
                      <thead>
                        <tr style={s.theadNavy}>
                          <th style={s.thCol} width="40%">Accessory</th>
                          <th style={s.thColRight} width="20%">Qty</th>
                          <th style={s.thColRight} width="20%">Rate</th>
                          <th style={s.thColRight} width="20%">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {agg.accessories.map((acc, i) => (
                          <tr key={i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                            <td style={s.tdLeft}>{acc.name || "Accessory"}</td>
                            <td style={s.tdRight}>{acc.qty || 1}</td>
                            <td style={s.tdRight}>{formatINR(acc.price || 0)}</td>
                            <td style={s.tdRight}>{formatINR((acc.price || 0) * (acc.qty || 1))}</td>
                          </tr>
                        ))}
                        <tr style={s.subtotalRow}>
                          <td style={s.subtotalLabel} colSpan="3">Accessories Total</td>
                          <td style={s.subtotalValue}>{formatINR(agg.accessoriesTotal || 0)}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}
                  <div style={{ textAlign: "right", marginTop: "2px" }}>
                    Room Total:{" "}
                    <span style={{ display: "inline-block", backgroundColor: "#d97706", color: "#ffffff", padding: "2px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: "700" }}>
                      {formatINR(agg.roomTotal || 0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* Extras */}
        {extras.length > 0 && (
          <>
            <div style={s.sectionTitle}>ADDITIONAL SERVICES</div>
            <table style={s.table}>
              <thead>
                <tr style={s.theadNavy}>
                  <th style={s.thCol} width="40%">Description</th>
                  <th style={s.thColRight} width="20%">Qty / Area</th>
                  <th style={s.thColRight} width="20%">Rate</th>
                  <th style={s.thColRight} width="20%">Amount</th>
                </tr>
              </thead>
              <tbody>
                {extras.map((ex, i) => {
                  const inputs = safeInputs(ex.inputs || {});
                  return (
                    <tr key={ex._id || i} style={i % 2 === 0 ? s.rowEven : s.rowOdd}>
                      <td style={s.tdLeft}>{ex.label}</td>
                      <td style={s.tdRight}>{ex.type === "ceiling" ? inputs.surfaces?.length || 1 : ex.type === "area_based" ? `${inputs.area} sq.ft` : "Fixed"}</td>
                      <td style={s.tdRight}>{ex.type === "ceiling" ? "As per design" : ex.type === "area_based" ? formatINR(inputs.unitPrice) : formatINR(inputs.price)}</td>
                      <td style={s.tdRight}>{formatINR(ex.total)}</td>
                    </tr>
                  );
                })}
                <tr style={s.subtotalRow}>
                  <td style={s.subtotalLabel} colSpan="3">Extras Total</td>
                  <td style={s.subtotalValue}>{formatINR(extrasTotal)}</td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Summary */}
        <div style={s.sectionTitle}>SUMMARY</div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <table style={{ width: "260px", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr><td style={s.summaryPlain.label}>Total Room Work</td><td style={s.summaryPlain.value}>{formatINR(roomsTotal)}</td></tr>
              {extrasTotal > 0 && <tr><td style={s.summaryPlain.label}>Additional Services</td><td style={s.summaryPlain.value}>{formatINR(extrasTotal)}</td></tr>}
              <tr><td style={s.summaryGray.label}>Sub Total</td><td style={s.summaryGray.value}>{formatINR(grandTotal)}</td></tr>
              {safeDiscount > 0 && <tr><td style={s.summaryDiscount.label}>Discount</td><td style={s.summaryDiscount.value}>- {formatINR(safeDiscount)}</td></tr>}
              <tr><td style={s.summaryFinal.label}>FINAL AMOUNT</td><td style={s.summaryFinal.value}>{formatINR(finalPayable)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <div style={s.footerGrid}>
          <div>
            <p style={s.footerLabel}>Contact Details:</p>
            <p style={{ margin: 0 }}>{company?.phones?.join(" | ")}</p>
            <p style={{ margin: 0 }}>{company?.email}</p>
          </div>
          <div>
            <p style={s.footerLabel}>Terms:</p>
            {(company?.termsAndConditions ?? []).length > 0 ? (
              <ul style={{ listStyleType: "disc", paddingLeft: "16px", margin: 0 }}>
                {company.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            ) : (
              <ul style={{ listStyleType: "disc", paddingLeft: "16px", margin: 0 }}>
                <li>Quotation valid for 30 days</li>
                <li>Final values based on site measurement</li>
                <li>40% advance, 60% on completion</li>
              </ul>
            )}
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: "12px" }}>
          <p style={{ margin: 0 }}>Thank you for considering {company?.name}. We look forward to serving you.</p>
        </div>
      </div>
    </div>
  );
});

export default ClientInvoiceT2;
