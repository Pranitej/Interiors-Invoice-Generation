// client/src/pages/SuperAdminDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Settings } from "lucide-react";
import API from "../api/api";
import PlatformSettingsModal from "../components/PlatformSettingsModal";

const emptyForm = {
  name: "",
  tagline: "",
  email: "",
  phones: "",
  registeredOffice: "",
  industryAddress: "",
  website: "",
  logoFile: "",
  adminUsername: "",
  adminPassword: "",
};

async function uploadLogo(file) {
  const data = new FormData();
  data.append("logo", file);
  const res = await API.post("/upload/logo", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data.filename;
}

function subscriptionLabel(company) {
  if (!company.subscriptionExpiryDate) return null;
  const now = new Date();
  const expiry = new Date(company.subscriptionExpiryDate);
  const diffMs = expiry - now;
  const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysLeft > 7)
    return { text: `${daysLeft}d left`, cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
  if (daysLeft > 0)
    return { text: `${daysLeft}d left`, cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" };
  return { text: "Expired", cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [formError, setFormError] = useState("");
  const [platformSettings, setPlatformSettings] = useState(null);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      API.get("/super-admin/stats"),
      API.get("/companies"),
      API.get("/subscription/platform-settings"),
    ])
      .then(([statsRes, companiesRes, settingsRes]) => {
        setStats(statsRes.data.data);
        setCompanies(companiesRes.data.data);
        setPlatformSettings(settingsRes.data.data);
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setForm(emptyForm);
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    setFormError("");
    try {
      const payload = {
        ...form,
        phones: form.phones.split(",").map((p) => p.trim()).filter(Boolean),
      };
      await API.post("/companies", payload);
      closeCreateModal();
      fetchAll();
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create company");
    } finally {
      setSubmitting(false);
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
        <button
          onClick={() => setShowPlatformSettings(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
        >
          <Settings className="w-4 h-4" />
          Platform Settings
        </button>
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

      {/* Platform Subscription Info */}
      {platformSettings && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 flex items-center gap-4 flex-wrap">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-semibold">Platform Subscription Price:</span>{" "}
            {platformSettings.subscriptionAmount > 0
              ? `₹${Number(platformSettings.subscriptionAmount).toLocaleString("en-IN")}`
              : "Not set"}
          </span>
          {platformSettings.upiQrFile && (
            <span className="text-sm text-blue-600 dark:text-blue-400">• UPI QR: Active</span>
          )}
        </div>
      )}

      {/* Companies Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Companies</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            + Add Company
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Company", "Status", "Subscription", "Users", "Invoices", "Actions"].map((h) => (
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
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    No companies yet.
                  </td>
                </tr>
              )}
              {companies.map((company) => {
                const subLabel = subscriptionLabel(company);
                return (
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
                    <td className="px-4 py-3">
                      {subLabel ? (
                        <div className="space-y-0.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${subLabel.cls}`}>
                            {subLabel.text}
                          </span>
                          <div className="text-xs text-gray-400">
                            {new Date(company.subscriptionExpiryDate).toLocaleDateString("en-IN")}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.userCount}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{company.invoiceCount}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/companies/${company._id}`)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
            <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Create New Company</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Set up a new tenant and admin account</p>
                </div>
                <button
                  onClick={closeCreateModal}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg p-3">
                    {formError}
                  </p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: "name", label: "Company Name *", placeholder: "Nova Interiors" },
                    { key: "tagline", label: "Tagline", placeholder: "Crafting Spaces..." },
                    { key: "email", label: "Email", placeholder: "contact@company.com" },
                    { key: "phones", label: "Phones (comma-separated)", placeholder: "9876543210, 9876543211" },
                    { key: "registeredOffice", label: "Registered Office", placeholder: "Plot 42, Jubilee Hills..." },
                    { key: "industryAddress", label: "Industry Address", placeholder: "Survey No. 201..." },
                    { key: "website", label: "Website", placeholder: "https://..." },
                    { key: "adminUsername", label: "Admin Username *", placeholder: "admin" },
                    { key: "adminPassword", label: "Admin Password *", placeholder: "••••••••" },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        {label}
                      </label>
                      <input
                        type={key === "adminPassword" ? "password" : "text"}
                        placeholder={placeholder}
                        value={form[key]}
                        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required={["name", "adminUsername", "adminPassword"].includes(key)}
                      />
                    </div>
                  ))}

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Company Logo
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setLogoUploading(true);
                          setFormError("");
                          try {
                            const filename = await uploadLogo(file);
                            setForm((f) => ({ ...f, logoFile: filename }));
                          } catch {
                            setFormError("Failed to upload logo");
                          } finally {
                            setLogoUploading(false);
                          }
                        }}
                        className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-400 hover:file:bg-blue-100 cursor-pointer"
                      />
                      {logoUploading && (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                      )}
                      {form.logoFile && !logoUploading && (
                        <span className="text-xs text-green-600 dark:text-green-400 flex-shrink-0">
                          ✓ {form.logoFile}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting || logoUploading}
                    className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all text-sm font-semibold disabled:opacity-50 shadow-sm"
                  >
                    {submitting ? "Creating..." : "Create Company"}
                  </button>
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    className="sm:w-auto px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Platform Settings Modal */}
      {showPlatformSettings && (
        <PlatformSettingsModal
          settings={platformSettings}
          onSave={(updated) => setPlatformSettings(updated)}
          onClose={() => setShowPlatformSettings(false)}
        />
      )}
    </div>
  );
}
