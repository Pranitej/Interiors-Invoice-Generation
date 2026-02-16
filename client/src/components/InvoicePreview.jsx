import { useState } from "react";
import { formatINR } from "../utils/calculations";
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "./ClientInvoice";
import { Shield, UserCheck } from "lucide-react";

export default function InvoicePreview({
  id,
  client,
  globalFrameRate,
  globalBoxRate,
  rooms,
  extrasState,
  grandTotal,
  discount,
  invoiceType,
  finalPayable,
  collapsedSections,
  toggleSection,
}) {
  const [viewMode, setViewMode] = useState("admin"); // 'admin' or 'client'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div
        className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-between cursor-pointer"
        onClick={() => toggleSection("preview")}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-indigo-600 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h2 className="font-bold text-gray-800 dark:text-white">
            Invoice Preview
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatINR(finalPayable)}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
              collapsedSections.preview ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {!collapsedSections.preview && (
        <div className="p-3 space-y-4">
          {/* Professional View Mode Toggle */}
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900/50 dark:to-blue-900/20 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left side - Title and description */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white">
                      Invoice View Mode
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Toggle between detailed and client-friendly views
                    </p>
                  </div>
                </div>
              </div>

              {/* Right side - Toggle with enhanced styling */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Enhanced Toggle Switch */}
                <div className="relative bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 shadow-sm">
                  <div className="flex items-center">
                    {/* Admin Button */}
                    <button
                      onClick={() => setViewMode("admin")}
                      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "admin"
                          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md ring-1 ring-blue-300 dark:ring-blue-700 cursor-not-allowed"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border-r border-gray-200 dark:border-gray-700 cursor-pointer"
                      }`}
                    >
                      <div className="relative">
                        <Shield
                          className={`w-4 h-4 transition-all duration-200 ${
                            viewMode === "admin"
                              ? "text-white"
                              : "text-blue-500 dark:text-blue-400"
                          }`}
                          strokeWidth={viewMode === "admin" ? 2.5 : 2}
                        />
                        {viewMode === "admin" && (
                          <div className="absolute -inset-0.5 bg-blue-400/20 blur-sm rounded-full"></div>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm">Admin</span>
                      </div>
                    </button>

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-0.5"></div>

                    {/* Client Button */}
                    <button
                      onClick={() => setViewMode("client")}
                      className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                        viewMode === "client"
                          ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md ring-1 ring-green-300 dark:ring-green-700 cursor-not-allowed"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      }`}
                    >
                      <div className="relative">
                        <UserCheck
                          className={`w-4 h-4 transition-all duration-200 ${
                            viewMode === "client"
                              ? "text-white"
                              : "text-green-500 dark:text-green-400"
                          }`}
                          strokeWidth={viewMode === "client" ? 2.5 : 2}
                        />
                        {viewMode === "client" && (
                          <div className="absolute -inset-0.5 bg-green-400/20 blur-sm rounded-full"></div>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold text-sm">Client</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Preview Container */}
          <div className="relative">
            {/* Scroll Indicators */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>
            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>
            <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>

            {/* Scrollable Invoice Container */}
            <div className="overflow-x-auto overflow-y-auto max-h-[70vh] rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-900">
              <div className="min-w-[210mm]">
                {viewMode === "admin" ? (
                  <AdminInvoice
                    invoice={{
                      ...(id ? { _id: id } : {}),
                      client,
                      pricing: {
                        frameRate: globalFrameRate,
                        boxRate: globalBoxRate,
                      },
                      rooms,
                      extras: extrasState,
                      grandTotal,
                      discount,
                      invoiceType,
                      finalPayable,
                      createdBy: "admin",
                      role: "admin",
                      createdAt: new Date().toISOString(),
                    }}
                  />
                ) : (
                  <ClientInvoice
                    invoice={{
                      ...(id ? { _id: id } : {}),
                      client,
                      pricing: {
                        frameRate: globalFrameRate,
                        boxRate: globalBoxRate,
                      },
                      rooms,
                      extras: extrasState,
                      grandTotal,
                      discount,
                      invoiceType,
                      finalPayable,
                      createdBy: "admin",
                      role: "admin",
                      createdAt: new Date().toISOString(),
                    }}
                  />
                )}
              </div>
            </div>

            {/* Enhanced Scroll Instructions */}
            <div className="mt-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center animate-bounce">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Scroll to view complete invoice
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Use horizontal scroll for width, vertical for height
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      View:
                    </span>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        viewMode === "admin"
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300"
                      }`}
                    >
                      {viewMode === "admin" ? "Admin" : "Client"}
                    </span>
                  </div>
                  <div className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Total:
                    </span>{" "}
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {formatINR(finalPayable)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
