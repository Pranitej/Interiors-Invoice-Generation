// src/components/ClientInvoice.jsx
import { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const ClientInvoice = forwardRef(({ invoice }, ref) => {
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

  const invoiceIdShort = invoice._id
    ? `INV-${String(invoice._id).slice(-6).toUpperCase()}`
    : "";

  return (
    <div
      ref={ref}
      className="bg-white text-black p-4 text-xs w-full max-w-none min-w-full"
      style={{
        width: "800px",
        fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
      }}
    >
      {/* Header */}
      <div className="border-b-2 border-gray-800 pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            {/* Logo Container */}
            <div className="w-16 h-16 flex-shrink-0 mt-1">
              <img
                src={`${import.meta.env.VITE_API_BASE}/public/skanda-logo.png`}
                alt="Skanda Industries Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if logo fails to load
                  e.currentTarget.style.display = "none";
                  const parent = e.currentTarget.parentElement;
                  parent.innerHTML = `
              <div class="w-16 h-16 border border-gray-300 bg-gray-100 flex items-center justify-center">
                <span class="text-xs font-bold text-gray-700">SKANDA</span>
              </div>
            `;
                }}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                SKANDA INDUSTRIES
              </h1>
              <p className="text-[10px] text-gray-600 leading-tight mt-1">
                <span className="font-medium">Regd Office:</span> H.No:
                24-7-225-15/A/2, Pragathi nagar Phase - II, Near Euro Kids,
                Subedari, Hanamkonda
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Industry:</span> Sy No. 138/A/1 &
                138/2, Elkurthi Road, Grama Panchayat Office, Dharmasagar,
                Elkurthy PD, Hanumakonda, Telangana - 506142
              </p>
              <p className="text-[10px] text-gray-600">
                <span className="font-medium">Contact: </span>
                9700360963, 9866565057, 9246893307, 7799677762 |{" "}
                <span className="font-medium">Email: </span>
                industry.skanda@gmail.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Details */}
      <div className="mb-4">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th
                colSpan="4"
                className="p-1.5 text-left font-bold border border-gray-300"
              >
                CLIENT & INVOICE DETAILS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="25%"
              >
                Client Name
              </td>
              <td className="p-1.5 border border-gray-300" width="25%">
                {client.name || "—"}
                {invoice.invoiceType ? (
                  <span className="ml-1 text-[10px] font-medium text-gray-600">
                    ({invoice.invoiceType})
                  </span>
                ) : null}
              </td>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="25%"
              >
                Proforma Invoice No
              </td>
              <td
                className="p-1.5 border border-gray-300 font-semibold"
                width="25%"
              >
                {invoiceIdShort || "—"}
              </td>
            </tr>
            <tr>
              <td className="p-1.5 border border-gray-300 font-medium">
                Mobile
              </td>
              <td className="p-1.5 border border-gray-300">
                {client.mobile || "—"}
              </td>
              <td className="p-1.5 border border-gray-300 font-medium">Date</td>
              <td className="p-1.5 border border-gray-300">
                {invoiceDate || "—"}
              </td>
            </tr>
            <tr>
              <td className="p-1.5 border border-gray-300 font-medium">
                Email
              </td>
              <td className="p-1.5 border border-gray-300">
                {client.email || "—"}
              </td>
              <td className="p-1.5 border border-gray-300 font-medium">
                Site Address
              </td>
              <td className="p-1.5 border border-gray-300">
                {client.siteAddress || "—"}
              </td>
            </tr>
            {client.siteMapLink && (
              <tr>
                <td className="p-1.5 border border-gray-300 font-medium">
                  Location Map
                </td>
                <td colSpan="3" className="p-1.5 border border-gray-300">
                  <a
                    href={client.siteMapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-700 underline"
                  >
                    {client.siteMapLink.length > 60
                      ? client.siteMapLink.substring(0, 60) + "..."
                      : client.siteMapLink}
                  </a>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pricing Summary */}
      <div className="mb-4">
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th
                colSpan="3"
                className="p-1.5 text-left font-bold border border-gray-300"
              >
                PRICING RATES (per sqft)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="33%"
              >
                Frame Rate
              </td>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="33%"
              >
                Box Rate
              </td>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="34%"
              >
                Note
              </td>
            </tr>
            <tr>
              <td className="p-1.5 border border-gray-300 text-center">
                {frameworkRate ? formatINR(frameworkRate) : "—"}
              </td>
              <td className="p-1.5 border border-gray-300 text-center">
                {boxRate
                  ? formatINR(boxRate)
                  : frameworkRate
                    ? formatINR(frameworkRate * 1.4)
                    : "—"}
              </td>
              <td className="p-1.5 border border-gray-300 text-[10px] text-gray-600">
                Room-specific prices may vary based on requirements.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Rooms Breakdown */}
      {rooms.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2 border-b pb-1">
            Roomwise Breakdown
          </h3>
          {rooms.map((room, idx) => {
            const aggregates = roomsTotals[idx] || {};
            const roomFrameRate =
              typeof room.frameRate === "number" &&
              !Number.isNaN(room.frameRate)
                ? room.frameRate
                : frameworkRate || 0;
            const roomBoxRate =
              typeof room.boxRate === "number" && !Number.isNaN(room.boxRate)
                ? room.boxRate
                : boxRate || roomFrameRate * 1.4;

            return (
              <div key={idx} className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">
                    {room.name} - {room.description}
                  </h4>
                </div>

                {/* Main Room Items Table */}
                <table className="w-full text-[10px] border mb-1">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border p-1 text-left w-2/5">
                        Description
                      </th>
                      <th className="border p-1 text-right w-1/5">
                        Area (sq.ft)
                      </th>
                      <th className="border p-1 text-right w-1/5">Rate</th>
                      <th className="border p-1 text-right w-1/5">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-1">Frame Work</td>
                      <td className="border p-1 text-right">
                        {aggregates.frameAreaTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="border p-1 text-right">
                        {formatINR(roomFrameRate)}
                      </td>
                      <td className="border p-1 text-right font-medium">
                        {formatINR(aggregates.framePriceTotal || 0)}
                      </td>
                    </tr>
                    <tr>
                      <td className="border p-1">Box Work</td>
                      <td className="border p-1 text-right">
                        {aggregates.boxAreaTotal?.toFixed(2) || "0.00"}
                      </td>
                      <td className="border p-1 text-right">
                        {formatINR(roomBoxRate)}
                      </td>
                      <td className="border p-1 text-right font-medium">
                        {formatINR(aggregates.boxPriceTotal || 0)}
                      </td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="border p-1 font-bold" colSpan="3">
                        Room Items Subtotal
                      </td>
                      <td className="border p-1 text-right font-bold">
                        {formatINR(aggregates.itemsTotal || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Accessories Table */}
                {aggregates.accessories &&
                  aggregates.accessories.length > 0 && (
                    <table className="w-full text-[10px] border mb-1">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-1 text-left w-2/5">
                            Accessory Name
                          </th>
                          <th className="border p-1 text-right w-1/5">
                            Quantity
                          </th>
                          <th className="border p-1 text-right w-1/5">Rate</th>
                          <th className="border p-1 text-right w-1/5">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {aggregates.accessories.map((accessory, accIdx) => (
                          <tr key={accIdx}>
                            <td className="border p-1">
                              {accessory.name || "Accessory"}
                            </td>
                            <td className="border p-1 text-right">
                              {accessory.qty || 1}
                            </td>
                            <td className="border p-1 text-right">
                              {formatINR(accessory.price || 0)}
                            </td>
                            <td className="border p-1 text-right font-medium">
                              {formatINR(
                                (accessory.price || 0) * (accessory.qty || 1),
                              )}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="border p-1 font-bold" colSpan="3">
                            Accessories Total
                          </td>
                          <td className="border p-1 text-right font-bold">
                            {formatINR(aggregates.accessoriesTotal || 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                {/* Room Total Row */}
                <table className="w-full text-[10px] border">
                  <tbody>
                    <tr className="bg-gray-100">
                      <td className="border p-1 font-bold" colSpan="3">
                        Room Total (Items + Accessories)
                      </td>
                      <td className="border p-1 text-right font-bold">
                        {formatINR(aggregates.roomTotal || 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}

      {/* Extras */}
      {extras.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2 border-b pb-1">
            Additional Services
          </h3>
          <table className="w-full text-[10px] border">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-1 text-left w-2/5">Description</th>
                <th className="border p-1 text-right w-1/5">Quantity/Area</th>
                <th className="border p-1 text-right w-1/5">Rate</th>
                <th className="border p-1 text-right w-1/5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {extras.map((ex) => {
                const inputs = safeInputs(ex.inputs || {});
                const key = ex._id || ex.id || ex.key;

                return (
                  <tr key={key}>
                    <td className="border p-1">{ex.label}</td>
                    <td className="border p-1 text-right">
                      {ex.type === "ceiling"
                        ? inputs.surfaces?.length || 1
                        : ex.type === "area_based"
                          ? `${inputs.area} sq.ft`
                          : "Fixed"}
                    </td>
                    <td className="border p-1 text-right">
                      {ex.type === "ceiling"
                        ? "As per design"
                        : ex.type === "area_based"
                          ? formatINR(inputs.unitPrice)
                          : formatINR(inputs.price)}
                    </td>
                    <td className="border p-1 text-right font-medium">
                      {formatINR(ex.total)}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-gray-50">
                <td className="border p-1 font-bold" colSpan="3">
                  Extras Total
                </td>
                <td className="border p-1 text-right font-bold">
                  {formatINR(extrasTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      <div className="mb-4">
        <h3 className="font-bold text-sm mb-2 border-b pb-1">Summary</h3>
        <table className="w-full text-[10px] border">
          <tbody>
            <tr>
              <td className="border p-1 font-medium">Total Room Work</td>
              <td className="border p-1 text-right">{formatINR(roomsTotal)}</td>
            </tr>
            {extrasTotal > 0 && (
              <tr>
                <td className="border p-1 font-medium">Additional Services</td>
                <td className="border p-1 text-right">
                  + {formatINR(extrasTotal)}
                </td>
              </tr>
            )}
            {/* Sub Total */}
            <tr className="bg-gray-50">
              <td className="border p-1 font-medium">Sub Total</td>
              <td className="border p-1 text-right font-medium">
                {formatINR(grandTotal)}
              </td>
            </tr>

            {/* Discount */}
            {safeDiscount > 0 && (
              <tr>
                <td className="border p-1 font-medium text-red-600">
                  Discount
                </td>
                <td className="border p-1 text-right font-medium text-red-600">
                  - {formatINR(safeDiscount)}
                </td>
              </tr>
            )}

            {/* Final Amount */}
            <tr className="bg-gray-100">
              <td className="border p-1 font-bold">FINAL AMOUNT</td>
              <td className="border p-1 text-right font-bold text-base">
                {formatINR(finalPayable)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Terms and Footer */}
      <div className="mt-6 pt-4 border-t">
        <div className="grid grid-cols-2 gap-4 text-[10px] text-gray-600">
          <div>
            <p className="font-medium mb-1">Contact Details:</p>
            <p>9700360963 | 9866565057 | 9246893307 | 7799677762</p>
            <p>interior.skanda@gmail.com</p>
          </div>
          <div>
            <p className="font-medium mb-1">Terms:</p>
            <ul className="list-disc list-inside">
              <li>Quotation valid for 30 days</li>
              <li>Final values based on site measurement</li>
              <li>40% advance, 60% on completion</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 text-center text-[10px] text-gray-500">
          <p>
            Thank you for considering Skanda Industries. We look forward to
            serving you.
          </p>
        </div>
      </div>
    </div>
  );
});

export default ClientInvoice;
