import mongoose from "mongoose";

// FRAME
const FrameSchema = new mongoose.Schema({
  height: { type: Number, default: 8.5 },
  width: { type: Number, default: 1 },
  area: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
});

// BOX
const BoxSchema = new mongoose.Schema({
  height: { type: Number, default: 8.5 },
  width: { type: Number, default: 1 },
  depth: { type: Number, default: 1 },
  area: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
});

// ITEM
const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  frame: { type: FrameSchema, required: true, default: () => ({}) },
  box: { type: BoxSchema, required: true, default: () => ({}) },
  totalPrice: { type: Number, default: 0 },
});

// ACCESSORIES
const AccessorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  qty: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
});

// ROOM
const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },

  // Per-room rates
  frameRate: { type: Number, default: 0 },
  boxRate: { type: Number, default: 0 }, // ✅ NEW: room-wise box rate
  isCustomRate: { type: Boolean, default: false }, // ✅ NEW: track custom override (optional but matches frontend)

  items: [ItemSchema],
  accessories: [AccessorySchema],
  roomTotal: { type: Number, default: 0 },
});

/* ============================================================
   EXTRAS — UPDATED EXTRAS SCHEMA (CEILING PAINTING ADDED)
   ============================================================ */

const CeilingSurfaceSchema = new mongoose.Schema({
  type: String, // "saint_gobain"
  label: String, // "Saint Gobain"
  area: Number,
  unitPrice: Number,
  price: Number,
});

const ExtraInputsSchema = new mongoose.Schema({
  // -----------------------------------------
  // CEILING SURFACES
  // -----------------------------------------
  surfaces: [CeilingSurfaceSchema],

  // Slab charges
  electricalWiring: { type: Number, default: 0 },
  electricianCharges: { type: Number, default: 0 },
  ceilingLights: { type: Number, default: 0 },
  profileLights: { type: Number, default: 0 },

  // -----------------------------------------
  // CEILING PAINTING FIELDS
  // -----------------------------------------
  ceilingPaintingArea: { type: Number, default: 0 },
  ceilingPaintingUnitPrice: { type: Number, default: 0 },
  ceilingPaintingPrice: { type: Number, default: 0 },

  // -----------------------------------------
  // AREA-BASED EXTRAS
  // -----------------------------------------
  area: { type: Number },
  unitPrice: { type: Number },

  // -----------------------------------------
  // FIXED-PRICE EXTRAS
  // -----------------------------------------
  price: { type: Number },
});

const ExtraSchema = new mongoose.Schema({
  key: { type: String, required: true }, // "ceiling"
  label: { type: String, required: true }, // "Ceiling"
  type: { type: String, required: true }, // "ceiling", "area_based", "fixed"
  inputs: { type: ExtraInputsSchema, required: true },
  total: { type: Number, default: 0 },
});

// MAIN INVOICE SCHEMA
const InvoiceSchema = new mongoose.Schema(
  {
    client: {
      name: { type: String },
      mobile: { type: String },
      email: { type: String },
      siteAddress: { type: String },
      siteMapLink: { type: String },
    },

    pricing: {
      frameRate: { type: Number, required: true },
      boxRate: { type: Number, required: true }, // ✅ global box rate
    },

    rooms: [RoomSchema],

    // FULL EXTRAS ARRAY (with updated structure)
    extras: [ExtraSchema],

    grandTotalBeforeDiscount: { type: Number, default: 0 },

    discount: { type: Number, default: 0 },

    invoiceType: { type: String, default: "Basic" },

    finalPayableAfterDiscount: { type: Number, default: 0 },

    createdBy: { type: String },
    role: { type: String },
  },
  { timestamps: true },
);

export default mongoose.models.Invoice ||
  mongoose.model("Invoice", InvoiceSchema);
