// server/controllers/upload.controller.js
export function uploadLogo(req, res) {
  if (!req.file)
    return res.status(400).json({ success: false, message: "No file uploaded" });
  return res.json({ success: true, filename: req.file.filename });
}
