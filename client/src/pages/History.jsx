import { useEffect, useState, useContext } from "react";
import api from "../api/api";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { formatINR } from "../utils/calculations";
import { renderToStaticMarkup } from "react-dom/server";
import AdminInvoice from "../components/AdminInvoice";
import ClientInvoice from "../components/ClientInvoice";
import {
  formatISTDate,
  formatISTDateTime,
  formatISTTime,
} from "../utils/dateTime";
import {
  Search,
  ChevronDown,
  Download,
  Edit,
  Trash,
  Plus,
  FileText,
  Calendar,
  MapPin,
  User,
  Copy,
  Check,
  Loader2,
} from "lucide-react";

// -------------------------
// Helpers
// -------------------------
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .trim();
}

function buildSearchIndex(inv) {
  return normalize(
    [
      inv._id,
      inv.client?.name,
      inv.client?.siteAddress,
      inv.location,
      inv.invoiceType,
      inv.finalPayableAfterDiscount,
      inv.grandTotal,
      formatISTDateTime(inv.createdAt),
      inv.createdAt,
    ].join(" "),
  );
}

// -------------------------
// Component
// -------------------------
export default function History() {
  const { user } = useContext(AuthContext);
  const [invoices, setInvoices] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortBy, setSortBy] = useState("new-old");
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const navigate = useNavigate();

  // -------------------------
  // Fetch
  // -------------------------
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/invoices");
        setInvoices(Array.isArray(res.data) ? res.data : res.data?.data || []);
      } catch (error) {
        console.error("Failed to fetch invoices:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // -------------------------
  // Filtering + Search
  // -------------------------
  const filtered = invoices.filter((inv) => {
    const haystack = buildSearchIndex(inv);
    const needle = normalize(search);
    const matchesSearch = haystack.includes(needle);

    if (selectedFilter === "recent") {
      const d = new Date(inv.createdAt);
      const limit = new Date();
      limit.setDate(limit.getDate() - 30);
      return matchesSearch && d > limit;
    }

    if (selectedFilter === "high-value") {
      return matchesSearch && inv.finalPayableAfterDiscount > 50000;
    }

    if (selectedFilter === "admin-only") {
      return matchesSearch && user?.isAdmin;
    }

    return matchesSearch;
  });

  // -------------------------
  // Sorting
  // -------------------------
  const sortedInvoices = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "a-z":
        return normalize(a.client?.name).localeCompare(
          normalize(b.client?.name),
        );

      case "z-a":
        return normalize(b.client?.name).localeCompare(
          normalize(a.client?.name),
        );

      case "new-old":
        return new Date(b.createdAt) - new Date(a.createdAt);

      case "old-new":
        return new Date(a.createdAt) - new Date(b.createdAt);

      case "amount-high-low":
        return (
          (b.finalPayableAfterDiscount || 0) -
          (a.finalPayableAfterDiscount || 0)
        );

      case "amount-low-high":
        return (
          (a.finalPayableAfterDiscount || 0) -
          (b.finalPayableAfterDiscount || 0)
        );

      default:
        return 0;
    }
  });

  // -------------------------
  // Actions
  // -------------------------
  const handleDownload = async (id, type) => {
    try {
      setIsDownloading(true);
      setActiveInvoice(id);

      const invoice = (await api.get(`/invoices/${id}`)).data;
      const Component = type === "admin" ? AdminInvoice : ClientInvoice;

      const html = `<!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8"/>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${renderToStaticMarkup(<Component invoice={invoice} />)}
          </body>
        </html>`;

      const res = await api.post(
        "/pdf/render",
        { html },
        { responseType: "blob" },
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `Skanda-${type}-Invoice-${id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("PDF generation failed");
    } finally {
      setIsDownloading(false);
      setActiveInvoice(null);
    }
  };

  const handleDelete = async (id) => {
    if (!user?.isAdmin) {
      alert("Access denied");
      return;
    }

    setActiveInvoice(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!activeInvoice) return;

    try {
      await api.delete(`/invoices/${activeInvoice}`);
      setInvoices((p) => p.filter((i) => i._id !== activeInvoice));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete invoice");
    } finally {
      setShowDeleteConfirm(false);
      setActiveInvoice(null);
    }
  };

  const handleEdit = (id) => user?.isAdmin && navigate(`/new-quote/${id}`);

  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Invoice History
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {sortedInvoices.length} invoices • Total:{" "}
              {formatINR(
                sortedInvoices.reduce(
                  (sum, inv) => sum + (inv.finalPayableAfterDiscount || 0),
                  0,
                ),
              )}
            </p>
          </div>

          <button
            onClick={() => navigate("/new-quote")}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            New Invoice
          </button>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <select
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                <option value="all">All Invoices</option>
                <option value="recent">Last 30 days</option>
                <option value="high-value">High value (&gt; ₹50k)</option>
                {user?.isAdmin && (
                  <option value="admin-only">Admin only</option>
                )}
              </select>
              <ChevronDown
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={14}
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                className="w-full pl-3 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="new-old">Newest first</option>
                <option value="old-new">Oldest first</option>
                <option value="a-z">Client A → Z</option>
                <option value="z-a">Client Z → A</option>
                <option value="amount-high-low">Amount High → Low</option>
                <option value="amount-low-high">Amount Low → High</option>
              </select>
              <ChevronDown
                className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={14}
              />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-center sm:justify-end">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {sortedInvoices.length}
                </span>{" "}
                results
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">
            Loading invoices...
          </span>
        </div>
      ) : sortedInvoices.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No invoices found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {search
              ? "Try a different search term"
              : "Create your first invoice to get started"}
          </p>
          {!search && (
            <button
              onClick={() => navigate("/new-quote")}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create New Invoice
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sortedInvoices.map((invoice) => (
            <div
              key={invoice._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
            >
              {/* Desktop View */}
              <div className="hidden lg:flex items-center p-4">
                {/* Client & ID */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {invoice.client?.name || "Unnamed Client"}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center text-md">
                    <button
                      onClick={() => copyToClipboard(invoice._id)}
                      className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {copiedId === invoice._id ? (
                        <>
                          <Check size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />#{invoice._id.slice(-8)}
                        </>
                      )}
                    </button>
                    <small className="text-gray-600">
                      ({invoice.invoiceType})
                    </small>
                  </div>
                </div>

                {/* Location */}
                <div className="flex-shrink-0 px-4 min-w-[160px] max-w-[200px]">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <MapPin size={12} className="flex-shrink-0" />
                    <span className="truncate">
                      {invoice.client.siteAddress || "—"}
                    </span>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex-shrink-0 px-4 min-w-[120px] text-center">
                  <div className="text-xs text-gray-900 dark:text-white">
                    {formatISTDate(invoice.createdAt)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatISTTime(invoice.createdAt)}
                  </div>
                </div>

                {/* Amount */}
                <div className="flex-shrink-0 px-4 min-w-[100px] text-right">
                  <div className="font-semibold text-green-600 dark:text-green-400 truncate">
                    {formatINR(invoice.finalPayableAfterDiscount)}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 px-4 min-w-[180px]">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDownload(invoice._id, "client")}
                      disabled={isDownloading && activeInvoice === invoice._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      {isDownloading && activeInvoice === invoice._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Client
                    </button>

                    <button
                      onClick={() => handleDownload(invoice._id, "admin")}
                      disabled={isDownloading && activeInvoice === invoice._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-sm font-medium rounded transition-colors disabled:opacity-50 whitespace-nowrap"
                    >
                      <Download size={14} />
                      Admin
                    </button>

                    {user?.isAdmin && (
                      <>
                        <button
                          onClick={() => handleEdit(invoice._id)}
                          className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors flex-shrink-0"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(invoice._id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors flex-shrink-0"
                          title="Delete"
                        >
                          <Trash size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile View */}
              <div className="lg:hidden p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {invoice.client?.name || "Unnamed Client"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin
                        size={12}
                        className="text-gray-400 flex-shrink-0"
                      />
                      <span className="text-gray-600 dark:text-gray-300 truncate">
                        {invoice.client.siteAddress || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-semibold text-green-600 dark:text-green-400 mb-1">
                      {formatINR(invoice.finalPayableAfterDiscount)}
                    </div>
                    <button
                      onClick={() => copyToClipboard(invoice._id)}
                      className="cursor-pointer inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      {copiedId === invoice._id ? (
                        <>
                          <Check size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />#{invoice._id.slice(-8)}
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-3 flex justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar
                      size={12}
                      className="text-gray-400 flex-shrink-0"
                    />
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatISTDateTime(invoice.createdAt)}
                    </span>
                  </div>
                  <div className="items-center gap-2 text-sm text-gray-600">
                    <p>({invoice.invoiceType})</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload(invoice._id, "client")}
                      disabled={isDownloading && activeInvoice === invoice._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-sm font-medium rounded transition-colors disabled:opacity-50"
                    >
                      {isDownloading && activeInvoice === invoice._id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Download size={14} />
                      )}
                      Client
                    </button>

                    <button
                      onClick={() => handleDownload(invoice._id, "admin")}
                      disabled={isDownloading && activeInvoice === invoice._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-sm font-medium rounded transition-colors disabled:opacity-50"
                    >
                      <Download size={14} />
                      Admin
                    </button>
                  </div>

                  {user?.isAdmin && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(invoice._id)}
                        className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => handleDelete(invoice._id)}
                        className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Downloading Overlay */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-xs w-full mx-4 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-12 h-12 border-3 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                <Download
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400"
                  size={18}
                />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Generating PDF
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-xs w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash className="text-red-600 dark:text-red-400" size={20} />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                Delete Invoice?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setActiveInvoice(null);
                  }}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center gap-1"
                >
                  <Trash size={14} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
