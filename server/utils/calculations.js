export function formatINR(value = 0) {
  const n = Number(value || 0);
  return n.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  });
}
