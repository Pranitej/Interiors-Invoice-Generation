// client/src/components/PlatformSettingsModal.jsx
import { useState } from "react";
import { X, Settings, Upload, CheckCircle, ZoomIn } from "lucide-react";
import API from "../api/api";

export default function PlatformSettingsModal({ settings, onSave, onClose }) {
  const [amount, setAmount] = useState(settings?.subscriptionAmount != null ? String(settings.subscriptionAmount) : "");
  const [qrFile, setQrFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentQr, setCurrentQr] = useState(settings?.upiQrFile || "");
  const [showQrModal, setShowQrModal] = useState(false);

  const handleUploadQr = async () => {
    if (!qrFile) return;
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("qr", qrFile);
      const res = await API.post("/subscription/platform-settings/qr", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setCurrentQr(res.data.data.upiQrFile);
      setQrFile(null);
      onSave(res.data.data);
      setSuccess("UPI QR updated successfully");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload QR code");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveAmount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (amount === "" || isNaN(Number(amount)) || Number(amount) < 0) {
      setError("Enter a valid subscription amount");
      return;
    }
    setSaving(true);
    try {
      const res = await API.put("/subscription/platform-settings", {
        subscriptionAmount: Number(amount),
      });
      onSave(res.data.data);
      setSuccess("Subscription amount saved");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

  return (
    <>
    {showQrModal && (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={() => setShowQrModal(false)}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between w-full">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">UPI Payment QR</h3>
            <button
              onClick={() => setShowQrModal(false)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          <img
            src={`${API_BASE}/public/${currentQr}`}
            alt="UPI QR Code"
            className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-600 rounded-xl bg-white p-3"
          />
          {settings?.subscriptionAmount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <span className="text-sm text-green-600 dark:text-green-400">₹</span>
              <span className="text-base font-bold text-green-700 dark:text-green-300">
                {Number(settings.subscriptionAmount).toLocaleString("en-IN")}
              </span>
              <span className="text-sm text-green-600 dark:text-green-400">platform rate</span>
            </div>
          )}
        </div>
      </div>
    )}
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Platform Subscription Settings
          </h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
              {error}
            </p>
          )}
          {success && (
            <p className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </p>
          )}

          {/* Subscription Amount */}
          <form onSubmit={handleSaveAmount} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
                Default Subscription Amount
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                This amount is shown to clients when viewing their subscription status. Each company can have its own override amount.
              </p>
            </div>
          </form>

          {/* UPI QR Code */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-3">
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              UPI QR Code
            </label>

            {currentQr && (
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="group relative w-28 h-28 flex-shrink-0 border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-1 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Click to enlarge"
                >
                  <img
                    src={`${API_BASE}/public/${currentQr}`}
                    alt="UPI QR"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/30 rounded-lg transition-colors">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                  </span>
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current QR code shown to clients for payment</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setQrFile(e.target.files[0])}
                className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
              />
              <button
                type="button"
                disabled={!qrFile || uploading}
                onClick={handleUploadQr}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex-shrink-0"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
