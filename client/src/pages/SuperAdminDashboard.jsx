// client/src/pages/SuperAdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/super-admin/stats")
      .then((res) => setStats(res.data.stats))
      .catch(() => setError("Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return (
      <p className="text-center text-red-500 mt-8">{error}</p>
    );

  const cards = [
    { label: "Total Companies", value: stats.totalCompanies, color: "blue" },
    { label: "Active Companies", value: stats.activeCompanies, color: "green" },
    { label: "Total Users", value: stats.totalUsers, color: "purple" },
    { label: "Total Invoices", value: stats.totalInvoices, color: "amber" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
          Super Admin Dashboard
        </h1>
        <Link
          to="/companies"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Manage Companies
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <p className={`text-3xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
