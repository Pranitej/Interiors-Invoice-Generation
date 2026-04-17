// client/src/components/DeactivateModal.jsx
import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import API from "../api/api";

export default function DeactivateModal({ companyId, companyName, onSave, onClose }) {
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!remarks.trim()) { setError("Remarks are required to suspend a company"); return; }
    setSubmitting(true);
    try {
      const res = await API.patch(`/subscription/companies/${companyId}/deactivate`, { remarks });
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to suspend company");
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
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Suspend Company
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{companyName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This will immediately suspend the company. Users will not be able to create or edit invoices.
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
              {error}
            </p>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Reason for Suspension <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Subscription payment pending — please renew to regain access"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
            />
          </div>

          <div className="flex gap-2.5 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {submitting ? "Suspending..." : "Suspend Company"}
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
