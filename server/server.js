// server/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./database/db.js";
import seeding from "./database/seeding.js";
import invoiceRouter from "./routes/invoice.routes.js";
import authRouter from "./routes/auth.routes.js";
import pdfRouter from "./routes/pdf.routes.js";
import companyRouter from "./routes/company.routes.js";
import superAdminRouter from "./routes/superAdmin.routes.js";
import uploadRouter from "./routes/upload.routes.js";
import config from "./config.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use("/public", express.static("public"));

const PORT = process.env.PORT || 5000;

await connectDB();
await seeding();

app.use("/api/invoices", invoiceRouter);
app.use("/api/auth", authRouter);
app.use("/api/pdf", pdfRouter);
app.use("/api/companies", companyRouter);
app.use("/api/super-admin", superAdminRouter);
app.use("/api/upload", uploadRouter);

app.get("/", (_, res) =>
  res.send({ ok: true, message: `${config.platform.name} API` })
);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
