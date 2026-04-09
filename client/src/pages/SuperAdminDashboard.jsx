// client/src/pages/SuperAdminDashboard.jsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      API.get("/super-admin/stats"),
      API.get("/companies"),
    ])
      .then(([statsRes, companiesRes]) => {
        setStats(statsRes.data.data);
        setCompanies(companiesRes.data.data);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await API.patch(`/companies/${id}/toggle-active`);
      setCompanies((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: res.data.data.isActive } : c))
      );
    } catch {
      alert("Failed to toggle company status");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (error)
    return <p className="text-center text-red-500 mt-8">{error}</p>;

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
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm"
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className={`text-3xl font-bold mt-1 text-${card.color}-600 dark:text-${card.color}-400`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Companies Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Companies</h2>
          <Link
            to="/companies"
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Company
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Company", "Status", "Users", "Invoices", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {companies.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No companies yet.
                  </td>
                </tr>
              )}
              {companies.map((company) => (
                <tr key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800 dark:text-white">{company.name}</div>
                    <div className="text-xs text-gray-400">{company.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {company.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.userCount}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.invoiceCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/companies/${company._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleToggle(company._id)}
                        className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                          company.isActive
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-200"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200"
                        }`}
                      >
                        {company.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
