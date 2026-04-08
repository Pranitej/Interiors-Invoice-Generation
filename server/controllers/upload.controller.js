// server/controllers/upload.controller.js
import { sendSuccess, sendError } from "../utils/response.js";

export function uploadLogo(req, res) {
  if (!req.file)
    return sendError(res, 400, "No file uploaded");
  return sendSuccess(res, { filename: req.file.filename });
}
