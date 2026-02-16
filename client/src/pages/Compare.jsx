import { useEffect, useState } from "react";
import API from "../api/api";
import SearchableInvoiceSelect from "../components/SearchableInvoiceSelect";
import CompareInvoices from "../components/CompareInvoices";
import { InvoiceComparisonReport } from "../components/CompareInvoices";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Download,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  FileText,
  Users,
  X,
  ArrowRightLeft,
} from "lucide-react";

export default function ComparePage() {
  const [invoiceAId, setInvoiceAId] = useState("");
  const [invoiceBId, setInvoiceBId] = useState("");
  const [invoiceAData, setInvoiceAData] = useState(null);
  const [invoiceBData, setInvoiceBData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get("/invoices");
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setError("Failed to load invoices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!invoiceAData || !invoiceBData) {
      alert("Please select and load both invoices before downloading");
      return;
    }

    setDownloading(true);
    try {
      const html = `<!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8"/>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              @page { margin: 0mm; }
              body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="p-0 m-0">
          ${renderToStaticMarkup(
            <InvoiceComparisonReport
              invoiceA={invoiceAData}
              invoiceB={invoiceBData}
            />,
          )}
        </body>
      </html>`;

      const res = await API.post(
        "/pdf/render",
        { html },
        { responseType: "blob" },
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-Comparison-${invoiceAData.invoiceNumber || invoiceAId.slice(-6)}-${invoiceBData.invoiceNumber || invoiceBId.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const clearSelection = () => {
    setInvoiceAId("");
    setInvoiceBId("");
    setInvoiceAData(null);
    setInvoiceBData(null);
  };

  const swapInvoices = () => {
    setInvoiceAId(invoiceBId);
    setInvoiceBId(invoiceAId);
    setInvoiceAData(invoiceBData);
    setInvoiceBData(invoiceAData);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-10">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Invoice Comparison
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Compare two invoices side by side and generate detailed comparison
            reports
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-center gap-3">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
              <span className="text-gray-700 dark:text-gray-300">
                Loading invoices...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 dark:text-red-300 font-medium mb-1">
                  Failed to load invoices
                </p>
                <p className="text-red-700 dark:text-red-400 text-sm mb-3">
                  {error}
                </p>
                <button
                  onClick={fetchInvoices}
                  className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* Selection Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Invoice A Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  First Invoice
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded">
                  Invoice A
                </span>
              </div>
              <SearchableInvoiceSelect
                label="Select Invoice"
                invoices={invoices}
                value={invoiceAId}
                onChange={setInvoiceAId}
                placeholder="Search by client, ID, date..."
                className="w-full"
              />
              {invoiceAData && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected:
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                      Loaded
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-900 dark:text-white">
                        {invoiceAData.client?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        #
                        {invoiceAData.invoiceNumber ||
                          invoiceAData._id?.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Invoice B Selection */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  Second Invoice
                </h2>
                <span className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded">
                  Invoice B
                </span>
              </div>
              <SearchableInvoiceSelect
                label="Select Invoice"
                invoices={invoices}
                value={invoiceBId}
                onChange={setInvoiceBId}
                placeholder="Search by client, ID, date..."
                className="w-full"
              />
              {invoiceBData && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Selected:
                    </span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                      Loaded
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-900 dark:text-white">
                        {invoiceBData.client?.name || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="font-mono text-gray-700 dark:text-gray-300">
                        #
                        {invoiceBData.invoiceNumber ||
                          invoiceBData._id?.slice(-8)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Bar - More Compact Mobile Version */}
          {(invoiceAId || invoiceBId) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3">
              {/* Mobile - Stacked Layout */}
              <div className="sm:hidden space-y-3">
                {/* Selection Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {invoiceAId && invoiceBId
                        ? "Both Selected"
                        : "One Selected"}
                    </span>
                    <div className="flex items-center gap-1">
                      {invoiceAData && (
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded-full flex items-center justify-center">
                          A
                        </span>
                      )}
                      {invoiceBData && (
                        <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-medium rounded-full flex items-center justify-center">
                          B
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={clearSelection}
                      disabled={!invoiceAId && !invoiceBId}
                      className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Clear All"
                      aria-label="Clear All"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {invoiceAId && invoiceBId && (
                      <button
                        onClick={swapInvoices}
                        className="p-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        title="Swap Invoices"
                        aria-label="Swap Invoices"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {invoiceAId && invoiceBId && invoiceAData && invoiceBData && (
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>PDF</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Desktop - Original Layout */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selected:{" "}
                    {invoiceAId && invoiceBId ? "Both invoices" : "One invoice"}
                  </div>
                  <div className="flex items-center gap-2">
                    {invoiceAData && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs font-medium rounded">
                        Invoice A
                      </span>
                    )}
                    {invoiceBData && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 text-xs font-medium rounded">
                        Invoice B
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    disabled={!invoiceAId && !invoiceBId}
                  >
                    Clear All
                  </button>
                  {invoiceAId && invoiceBId && (
                    <button
                      onClick={swapInvoices}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                    >
                      Swap A ↔ B
                    </button>
                  )}
                  {invoiceAId && invoiceBId && invoiceAData && invoiceBData && (
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Download Comparison PDF
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Comparison Section */}
          {invoiceAId && invoiceBId && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 bg-blue-500 rounded"></div>
                    <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                      Comparison Results
                    </h2>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 max-sm:hidden">
                    Scroll horizontally to view full comparison →
                  </div>
                </div>
              </div>

              {/* Scrollable Comparison Container */}
              <div className="relative">
                {/* Horizontal scroll indicator - adjust for dark mode */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent pointer-events-none z-10"></div>

                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-400px)] min-h-[400px]">
                  <div className="min-w-full p-4 md:p-6">
                    <CompareInvoices
                      invoiceAId={invoiceAId}
                      invoiceBId={invoiceBId}
                      onLoadedA={setInvoiceAData}
                      onLoadedB={setInvoiceBData}
                    />
                  </div>
                </div>

                {/* Mobile scroll hint */}
                <div className="md:hidden px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <ChevronRight className="w-4 h-4 animate-pulse" />
                    Swipe horizontally to see more content
                    <ChevronRight className="w-4 h-4 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!invoiceAId && !invoiceBId && !loading && !error && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 md:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Start Comparing Invoices
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Select two invoices from the dropdowns above to begin
                  comparison and generate detailed reports.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Select Invoice A
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="text-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mx-auto mb-2"></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Select Invoice B
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-2">
                      <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Download PDF
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>
              Compare up to two invoices at a time. PDF reports include detailed
              breakdowns of all differences.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
