import fs from "fs/promises";
import path from "path";
import Company from "../models/Company.js";
import PlatformSettings from "../models/PlatformSettings.js";
import config from "../config.js";

export async function runImageCleanup() {
  const dir = config.upload.destination;

  let files;
  try {
    files = await fs.readdir(dir);
  } catch {
    return { deleted: [], kept: [], skipped: [], note: `directory '${dir}' not readable` };
  }

  const [companies, platformSettings] = await Promise.all([
    Company.find({ logoFile: { $ne: "" } }, "logoFile").lean(),
    PlatformSettings.findOne({ key: "global" }, "upiQrFile").lean(),
  ]);

  const referenced = new Set([
    ...companies.map((c) => c.logoFile).filter(Boolean),
    platformSettings?.upiQrFile || "",
  ]);
  referenced.delete("");

  const deleted = [];
  const kept = [];
  const skipped = [];

  await Promise.all(
    files.map(async (file) => {
      if (referenced.has(file)) {
        kept.push(file);
        return;
      }
      try {
        await fs.unlink(path.join(dir, file));
        deleted.push(file);
      } catch (err) {
        skipped.push({ file, reason: err.message });
      }
    })
  );

  return { deleted, kept, skipped };
}
