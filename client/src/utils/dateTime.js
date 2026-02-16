function toISTDate(dateInput) {
  const date = new Date(dateInput);

  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value;

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
  };
}

export function formatISTDate(dateInput) {
  const { day, month, year } = toISTDate(dateInput);

  return `${day}-${month}-${year}`;
}

export function formatISTTime(dateInput) {
  const { hour, minute } = toISTDate(dateInput);

  const h = Number(hour);
  const hh12 = ((h + 11) % 12) + 1;
  const meridiem = h >= 12 ? "PM" : "AM";

  const paddedHour12 = String(hh12).padStart(2, "0");

  return `${paddedHour12}:${minute} ${meridiem}`;
}

export function formatISTDateTime(dateInput) {
  const { day, month, year, hour, minute } = toISTDate(dateInput);

  const h = Number(hour);
  const hh12 = ((h + 11) % 12) + 1;
  const meridiem = h >= 12 ? "PM" : "AM";

  const paddedHour12 = String(hh12).padStart(2, "0");

  return `${day}-${month}-${year}, ${paddedHour12}:${minute} ${meridiem}`;
}
