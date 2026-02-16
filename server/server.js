import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import seeding from "./database/seeding.js";
import invoicesRouter from "./routes/invoices.js";
import authRouter from "./routes/auth.js";
import pdfRoutes from "./routes/pdf.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/public", express.static("public"));

const PORT = process.env.PORT || 5000;

await connectDB();

await seeding();

app.use("/api/invoices", invoicesRouter);
app.use("/api/auth", authRouter);
app.use("/api/pdf", pdfRoutes);

app.get("/", (_, res) =>
  res.send({ ok: true, message: "Skanda Industries API" })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
