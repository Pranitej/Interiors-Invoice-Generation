export function calcArea({ workType, h, w, d = 1 }) {
  if (workType === "box") return Number((h * w * d).toFixed(3));
  return Number((h * w).toFixed(3));
}

export function calcPrice({ area, workType, frameRate, boxRate }) {
  const rate = workType === "box" ? boxRate : frameRate;
  return Number((area * rate).toFixed(2));
}

export function formatINR(amount) {
  if (typeof amount !== "number") amount = Number(amount) || 0;
  return (
    "₹" +
    amount.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export const roundTo2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;
