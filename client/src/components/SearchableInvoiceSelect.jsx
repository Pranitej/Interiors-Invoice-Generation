import { useMemo, useState, useEffect, useRef } from "react";
import { formatISTDateTime } from "../utils/dateTime";
import { Search, ChevronDown, X, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SearchableInvoiceSelect({
  label,
  invoices = [],
  value,
  onChange,
  placeholder = "Search invoices...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();

    if (!q) return invoices;

    return invoices.filter((inv) => {
      const clientName = inv.client?.name || "";
      const site = inv.client?.siteAddress || "";
      const type = inv.invoiceType || "";
      const id = inv._id || "";
      const date = inv.createdAt ? formatISTDateTime(inv.createdAt) : "";

      const searchString =
        `${clientName} ${site} ${type} ${id} ${date}`.toLowerCase();
      return searchString.includes(q);
    });
  }, [invoices, query]);

  const selected = invoices.find((i) => i._id === value);

  const clearSelection = () => {
    onChange("");
    setQuery("");
  };

  const handleEditClick = (e, invoiceId) => {
    e.stopPropagation();
    // For now, using a dummy link. Replace with actual URL later
    navigate(`/new-quote/${invoiceId}`);
    // const editUrl = `/new-quote/${invoiceId}`;
    // window.location.href = editUrl; // Or use your router's navigation method
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}

      {/* Selected / Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            setOpen(!open);
            if (!open) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className={`
            w-full px-4 py-3 text-left rounded-lg border transition-all duration-200
            ${open ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-600"}
            ${isFocused ? "border-blue-500" : "hover:border-gray-400 dark:hover:border-gray-500"}
            ${selected ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-900"}
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            dark:text-white
          `}
          aria-expanded={open}
          aria-haspopup="listbox"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              {selected ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {selected.client?.name || "No Name"}
                    </span>
                    {selected.status && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          selected.status,
                        )}`}
                      >
                        {selected.status}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                    <span>ID: {selected._id.slice(-8)}</span>
                    {selected.invoiceType && (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                        {selected.invoiceType}
                      </span>
                    )}
                    {selected.createdAt && (
                      <span>{formatISTDateTime(selected.createdAt)}</span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  Select an invoice...
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 ml-2">
              {selected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(e, selected._id);
                  }}
                  className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                  title="Edit invoice"
                  aria-label="Edit invoice"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {selected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                  title="Clear selection"
                  aria-label="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                  open ? "rotate-180" : ""
                }`}
              />
            </div>
          </div>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
          role="listbox"
        >
          {/* Search */}
          <div className="p-3 border-b dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                aria-label="Search invoices"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="mb-2">No invoices found</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">
                  {query
                    ? "Try a different search term"
                    : "No invoices available"}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((inv) => {
                  const displayDate = inv.createdAt
                    ? formatISTDateTime(inv.createdAt)
                    : "";
                  const isSelected = inv._id === value;

                  return (
                    <div
                      key={inv._id}
                      onClick={() => {
                        onChange(inv._id);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={`
                        relative p-3 cursor-pointer rounded-lg transition-all duration-150
                        ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        }
                      `}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-medium truncate ${
                                isSelected
                                  ? "text-blue-700 dark:text-blue-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {inv.client?.name || "No Name"}
                            </span>
                            {inv.status && (
                              <span
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusColor(
                                  inv.status,
                                )}`}
                              >
                                {inv.status}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {inv.client?.siteAddress || "No address"}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                              {inv.invoiceType || "N/A"}
                            </span>
                            <span>{displayDate}</span>
                            <span>ID: {inv._id.slice(-8)}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleEditClick(e, inv._id)}
                          className={`
                            ml-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-all
                            ${isSelected ? "opacity-100" : ""}
                            text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30
                          `}
                          title="Edit invoice"
                          aria-label="Edit invoice"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-3 py-2 border-t dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-b-lg">
              Showing {filtered.length} of {invoices.length} invoices
            </div>
          )}
        </div>
      )}
    </div>
  );
}
