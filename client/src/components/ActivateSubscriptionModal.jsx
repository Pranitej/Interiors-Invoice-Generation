// client/src/components/ActivateSubscriptionModal.jsx
import { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import API from "../api/api";

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque"];

const DURATION_PRESETS = [
  { label: "+7d",   days: 7 },
  { label: "+30d",  days: 30 },
  { label: "+3mo",  months: 3 },
  { label: "+6mo",  months: 6 },
  { label: "+1yr",  months: 12 },
];

function addDuration(base, { days, months }) {
  const d = base ? new Date(base) : new Date();
  if (days)   d.setDate(d.getDate() + days);
  if (months) d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function ActivateSubscriptionModal({ companyId, companyName, currentAmount, platformAmount, onSave, onClose }) {
  const companyRate = currentAmount ?? platformAmount ?? null;
  const [expiryDate, setExpiryDate] = useState("");
  const [amount, setAmount] = useState(companyRate ? String(companyRate) : "");
  const [modeOfPayment, setModeOfPayment] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!expiryDate) { setError("Expiry date is required"); return; }
    if (!modeOfPayment) { setError("Mode of payment is required"); return; }
    setSubmitting(true);
    try {
      const res = await API.post(`/subscription/companies/${companyId}/activate`, {
        expiryDate,
        amount: amount ? Number(amount) : undefined,
        modeOfPayment,
        remarks,
      });
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate subscription");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Activate Subscription
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{companyName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Subscription Expiry Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              min={minDateStr}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {DURATION_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setExpiryDate(addDuration(expiryDate, preset))}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
              {expiryDate && (
                <button
                  type="button"
                  onClick={() => setExpiryDate("")}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Mode of Payment <span className="text-red-500">*</span>
            </label>
            <select
              value={modeOfPayment}
              onChange={(e) => setModeOfPayment(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="">Select payment mode</option>
              {PAYMENT_MODES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                Amount Paid (₹) <span className="text-red-500">*</span>
              </label>
              {companyRate != null && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  company rate: ₹{Number(companyRate).toLocaleString("en-IN")}
                </span>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="1"
              placeholder={companyRate ? String(companyRate) : "0"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Recorded in the transaction only — does not change the company rate.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Remarks / Notes (optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Payment received — renewal for 1 year"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Activating..." : "Activate Subscription"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
