// src/components/AdminInvoice.jsx
import React, { forwardRef } from "react";
import { formatINR } from "../utils/calculations";

const AdminInvoice = forwardRef(function AdminInvoice({ invoice }, ref) {
  if (!invoice) return null;

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
  /* COMPACT PROFESSIONAL UI START                             */
  /* ========================================================= */

  return (
    <div
      ref={ref}
      className=" bg-white p-4 text-xs text-black w-full max-w-none min-w-full print-page"
      style={{ maxWidth: "210mm" }}
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

      {/* Client Details & Invoice Info in Compact Table */}
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
            {useCurrentLocation && client.siteMapLink && (
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
                Global Frame Rate
              </td>
              <td
                className="p-1.5 border border-gray-300 font-medium"
                width="33%"
              >
                Global Box Rate
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
                Room-specific rates override these when provided
              </td>
            </tr>
          </tbody>
        </table>
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

        return (
          <div key={roomIndex} className="mb-3">
            {/* Room Header */}
            <div className="flex justify-between items-center mb-1 bg-gray-100 p-1.5">
              <div>
                <span className="font-bold text-[11px]">
                  ROOM: {room.name || `Room ${roomIndex + 1}`}
                </span>
                {room.description && (
                  <span className="text-[10px] text-gray-600 ml-2">
                    ({room.description})
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="flex gap-4 text-[10px]">
                  <span>
                    <span className="font-medium">Frame Rate:</span>{" "}
                    {formatINR(roomFrameRate)}
                  </span>
                  <span>
                    <span className="font-medium">Box Rate:</span>{" "}
                    {formatINR(roomBoxRate)}
                  </span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            {(room.items || []).length > 0 && (
              <table className="w-full border-collapse text-[10px] mb-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      className="p-1 border border-gray-300 text-left font-medium"
                      width="20%"
                    >
                      Item
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="12%"
                    >
                      Work Type
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="12%"
                    >
                      Width (ft)
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="12%"
                    >
                      Height (ft)
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="12%"
                    >
                      Depth (ft)
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="12%"
                    >
                      Area (sqft)
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="10%"
                    >
                      Price
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="10%"
                    >
                      Total
                    </th>
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
                          <tr
                            className={
                              itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            {rowSpan > 1 && (
                              <td
                                rowSpan={rowSpan}
                                className="p-1 border border-gray-300 align-top"
                              >
                                <div className="font-medium">{item.name}</div>
                              </td>
                            )}
                            {rowSpan === 1 && (
                              <td className="p-1 border border-gray-300 align-top">
                                <div className="font-medium">{item.name}</div>
                              </td>
                            )}
                            <td className="p-1 border border-gray-300 text-center">
                              Frame
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.frame.width}
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.frame.height}
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              —
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.frame.area.toFixed(2)}
                            </td>
                            <td className="p-1 border border-gray-300 text-right">
                              {formatINR(item.frame.price)}
                            </td>
                            {rowSpan > 1 && (
                              <td
                                rowSpan={rowSpan}
                                className="p-1 border border-gray-300 align-top text-right font-semibold"
                              >
                                {formatINR(itemTotal)}
                              </td>
                            )}
                            {rowSpan === 1 && (
                              <td className="p-1 border border-gray-300 align-top text-right font-semibold">
                                {formatINR(itemTotal)}
                              </td>
                            )}
                          </tr>
                        )}
                        {hasBox && (
                          <tr
                            className={
                              itemIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }
                          >
                            {!hasFrame && (
                              <td className="p-1 border border-gray-300 align-top">
                                <div className="font-medium">{item.name}</div>
                              </td>
                            )}
                            <td className="p-1 border border-gray-300 text-center">
                              Box
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.box.width}
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.box.height}
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.box.depth}
                            </td>
                            <td className="p-1 border border-gray-300 text-center">
                              {item.box.area.toFixed(2)}
                            </td>
                            <td className="p-1 border border-gray-300 text-right">
                              {formatINR(item.box.price)}
                            </td>
                            {!hasFrame && (
                              <td className="p-1 border border-gray-300 align-top text-right font-semibold">
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

            {/* Accessories Table */}
            {room.accessories?.length > 0 && (
              <table className="w-full border-collapse text-[10px] mb-1">
                <thead>
                  <tr className="bg-gray-50">
                    <th
                      colSpan="4"
                      className="p-1 border border-gray-300 text-left font-medium"
                    >
                      ACCESSORIES
                    </th>
                  </tr>
                  <tr className="bg-gray-100">
                    <th
                      className="p-1 border border-gray-300 text-left font-medium"
                      width="50%"
                    >
                      Name
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="17%"
                    >
                      Unit Price
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="16%"
                    >
                      Qty
                    </th>
                    <th
                      className="p-1 border border-gray-300 text-center font-medium"
                      width="17%"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {room.accessories.map((acc, idx) => {
                    const total = (acc.price || 0) * (acc.qty || 0);
                    return (
                      <tr
                        key={idx}
                        className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="p-1 border border-gray-300">
                          {acc.name}
                        </td>
                        <td className="p-1 border border-gray-300 text-right">
                          {formatINR(acc.price)}
                        </td>
                        <td className="p-1 border border-gray-300 text-center">
                          {acc.qty}
                        </td>
                        <td className="p-1 border border-gray-300 text-right font-medium">
                          {formatINR(total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {/* Room Total */}
            <div className="text-right text-[11px] font-bold mt-1">
              Room Total: {formatINR(roomTotal)}
            </div>
          </div>
        );
      })}

      {/* Extras Section */}
      {extras.length > 0 && (
        <div className="mb-4">
          <div className="bg-gray-100 p-1.5 mb-1">
            <span className="font-bold text-[11px]">ADDITIONAL SERVICES</span>
          </div>

          {extras.map((ex) => {
            const inputs = safeInputs(ex.inputs || {});
            const key = ex._id || ex.id || ex.key;

            return (
              <div key={key} className="mb-2">
                <div className="text-[10px] font-medium mb-0.5">
                  {ex.label} (
                  {ex.type === "ceiling"
                    ? "Ceiling Work"
                    : ex.type === "area_based"
                      ? "Area Based"
                      : "Fixed"}
                  )
                </div>

                {ex.type === "ceiling" && (
                  <div className="pl-0">
                    {/* Surfaces */}
                    {inputs.surfaces.length > 0 && (
                      <table className="w-full border-collapse text-[10px] mb-1">
                        <thead>
                          <tr className="bg-gray-50">
                            <th
                              className="p-1 border border-gray-300 text-left"
                              width="40%"
                            >
                              Surface
                            </th>
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="20%"
                            >
                              Area (sqft)
                            </th>
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="20%"
                            >
                              Unit Price
                            </th>
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="20%"
                            >
                              Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {inputs.surfaces.map((s, i) => (
                            <tr
                              key={i}
                              className={
                                i % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="p-1 border border-gray-300">
                                {s.label}
                              </td>
                              <td className="p-1 border border-gray-300 text-center">
                                {s.area}
                              </td>
                              <td className="p-1 border border-gray-300 text-right">
                                {formatINR(s.unitPrice)}
                              </td>
                              <td className="p-1 border border-gray-300 text-right font-medium">
                                {formatINR(s.price)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}

                    {/* Electrical Details */}
                    <table className="w-full border-collapse text-[10px] mb-1">
                      <thead>
                        <tr className="bg-gray-50">
                          <th
                            className="p-1 border border-gray-300 text-center"
                            width="25%"
                          >
                            Electrical Wiring
                          </th>
                          <th
                            className="p-1 border border-gray-300 text-center"
                            width="25%"
                          >
                            Electrician Charges
                          </th>
                          <th
                            className="p-1 border border-gray-300 text-center"
                            width="25%"
                          >
                            Ceiling Lights
                          </th>
                          <th
                            className="p-1 border border-gray-300 text-center"
                            width="25%"
                          >
                            Profile Lights
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-1 border border-gray-300 text-center">
                            {formatINR(inputs.electricalWiring)}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            {formatINR(inputs.electricianCharges)}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            {formatINR(inputs.ceilingLights)}
                          </td>
                          <td className="p-1 border border-gray-300 text-center">
                            {formatINR(inputs.profileLights)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Painting Details */}
                    {inputs.ceilingPaintingArea > 0 && (
                      <table className="w-full border-collapse text-[10px] mb-1">
                        <thead>
                          <tr className="bg-gray-50">
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="34%"
                            >
                              Painting Area (sqft)
                            </th>
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="33%"
                            >
                              Unit Price
                            </th>
                            <th
                              className="p-1 border border-gray-300 text-center"
                              width="33%"
                            >
                              Painting Total
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-1 border border-gray-300 text-center">
                              {inputs.ceilingPaintingArea}
                            </td>
                            <td className="p-1 border border-gray-300 text-right">
                              {formatINR(inputs.ceilingPaintingUnitPrice)}
                            </td>
                            <td className="p-1 border border-gray-300 text-right font-medium">
                              {formatINR(inputs.ceilingPaintingPrice)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {ex.type === "area_based" && (
                  <table className="w-full border-collapse text-[10px] mb-1">
                    <thead>
                      <tr className="bg-gray-50">
                        <th
                          className="p-1 border border-gray-300 text-center"
                          width="34%"
                        >
                          Area (sqft)
                        </th>
                        <th
                          className="p-1 border border-gray-300 text-center"
                          width="33%"
                        >
                          Unit Price
                        </th>
                        <th
                          className="p-1 border border-gray-300 text-center"
                          width="33%"
                        >
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1 border border-gray-300 text-center">
                          {inputs.area}
                        </td>
                        <td className="p-1 border border-gray-300 text-right">
                          {formatINR(inputs.unitPrice)}
                        </td>
                        <td className="p-1 border border-gray-300 text-right font-semibold">
                          {formatINR(ex.total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                {ex.type === "fixed" && (
                  <table className="w-full border-collapse text-[10px] mb-1">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-1 border border-gray-300 text-center">
                          Fixed Price
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-1 border border-gray-300 text-center font-semibold">
                          {formatINR(inputs.price)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}

                <div className="text-right text-[10px] font-medium mb-1">
                  Service Total: {formatINR(ex.total)}
                </div>
              </div>
            );
          })}

          {/* Extras Total */}
          {extras.length > 0 && (
            <div className="text-right text-[11px] font-bold mt-2 border-t pt-1">
              Extras Total: {formatINR(extrasTotal)}
            </div>
          )}
        </div>
      )}

      {/* Summary Section */}
      <div className="mt-4">
        <div className="flex justify-end">
          <table className="w-64 border-collapse text-[11px]">
            <tbody>
              <tr>
                <td className="p-1.5 border border-gray-300 font-medium">
                  Rooms Total
                </td>
                <td className="p-1.5 border border-gray-300 text-right">
                  {formatINR(roomsTotal)}
                </td>
              </tr>
              {extras.length > 0 && (
                <tr>
                  <td className="p-1.5 border border-gray-300 font-medium">
                    Extras Total
                  </td>
                  <td className="p-1.5 border border-gray-300 text-right">
                    {formatINR(extrasTotal)}
                  </td>
                </tr>
              )}
              {/* Sub Total */}
              <tr className="bg-gray-50">
                <td className="p-1.5 border border-gray-300 font-medium">
                  Sub Total
                </td>
                <td className="p-1.5 border border-gray-300 text-right font-medium">
                  {formatINR(grandTotal)}
                </td>
              </tr>

              {/* Discount */}
              {safeDiscount > 0 && (
                <tr>
                  <td className="p-1.5 border border-gray-300 font-medium text-red-600">
                    Discount
                  </td>
                  <td className="p-1.5 border border-gray-300 text-right font-medium text-red-600">
                    - {formatINR(safeDiscount)}
                  </td>
                </tr>
              )}

              {/* Final Payable */}
              <tr className="bg-gray-100">
                <td className="p-1.5 border border-gray-300 font-bold">
                  FINAL AMOUNT
                </td>
                <td className="p-1.5 border border-gray-300 text-right font-bold text-base">
                  {formatINR(finalPayable)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-6 pt-4 border-t border-gray-300 text-[10px] text-gray-600">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-1">Terms & Conditions:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Payment: 50% advance, balance before delivery</li>
              <li>GST included in all prices</li>
              <li>1 year warranty on workmanship</li>
              <li>Delivery: 30-45 days from advance</li>
            </ul>
          </div>
          <div className="text-right">
            <p className="font-medium">For Skanda Industries</p>
            <p className="mt-2">Authorized Signatory</p>
            <div className="mt-4 border-t border-gray-300 pt-1">
              <p>Computer Generated Invoice - Valid without signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default AdminInvoice;
