import { useEffect, useState } from "react";
import { X, Shield, UserCheck } from "lucide-react";
import AdminInvoice from "./AdminInvoice";
import ClientInvoice from "./ClientInvoice";

export default function InvoicePreviewModal({ invoice, company, onClose }) {
  const [viewMode, setViewMode] = useState("admin");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!invoice) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={onClose}
    >
      <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-preview-title"
          className="bg-white dark:bg-gray-800 w-full max-w-5xl max-h-[90vh] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 p-4 border-b border-gray-200 dark:border-gray-700 flex-wrap sm:flex-nowrap">
          <h3 id="invoice-preview-title" className="text-base font-bold text-gray-900 dark:text-white shrink-0">
            Invoice Preview
          </h3>

          {/* Admin / Client toggle */}
          <div className="relative bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm order-3 sm:order-2 w-full sm:w-auto">
            <div className="flex items-center">
              <button
                type="button"
                aria-pressed={viewMode === "admin"}
                onClick={() => setViewMode("admin")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "admin"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Shield className="w-4 h-4" strokeWidth={viewMode === "admin" ? 2.5 : 2} />
                Admin
              </button>
              <div aria-hidden="true" className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5" />
              <button
                type="button"
                aria-pressed={viewMode === "client"}
                onClick={() => setViewMode("client")}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === "client"
                    ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <UserCheck className="w-4 h-4" strokeWidth={viewMode === "client" ? 2.5 : 2} />
                Client
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors order-2 sm:order-3 shrink-0"
            aria-label="Close preview"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          <div className="min-w-[210mm]">
            {viewMode === "admin" ? (
              <AdminInvoice invoice={invoice} company={company} />
            ) : (
              <ClientInvoice invoice={invoice} company={company} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
