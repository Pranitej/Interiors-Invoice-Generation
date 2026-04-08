export function sendSuccess(res, data = null, statusCode = 200, message = null) {
  const body = { success: true };
  if (data !== null) body.data = data;
  if (message !== null) body.message = message;
  res.status(statusCode).json(body);
}

export function sendError(res, statusCode, message) {
  res.status(statusCode).json({ success: false, message });
}
