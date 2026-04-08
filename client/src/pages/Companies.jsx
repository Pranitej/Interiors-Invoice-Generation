// client/src/pages/Companies.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

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
  return res.data.filename;
}

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCompanies = () => {
    setLoading(true);
    API.get("/companies")
      .then((res) => setCompanies(res.data.data))
      .catch(() => setError("Failed to load companies"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleToggle = async (id) => {
    try {
      const res = await API.patch(`/companies/${id}/toggle-active`);
      setCompanies((prev) =>
        prev.map((c) =>
          c._id === id ? { ...c, isActive: res.data.data.isActive } : c
        )
      );
    } catch {
      alert("Failed to toggle company status");
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its users/invoices? This cannot be undone.`)) return;
    try {
      await API.delete(`/companies/${id}`);
      setCompanies((prev) => prev.filter((c) => c._id !== id));
    } catch {
      alert("Failed to delete company");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        ...form,
        phones: form.phones.split(",").map((p) => p.trim()).filter(Boolean),
      };
      await API.post("/companies", payload);
      setForm(emptyForm);
      setShowForm(false);
      fetchCompanies();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create company");
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Companies</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {showForm ? "Cancel" : "+ Add Company"}
        </button>
      </div>

      {/* Create Company Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <h2 className="font-semibold text-gray-800 dark:text-white">New Company</h2>
          {error && <p className="text-sm text-red-600">{error}</p>}
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

            {/* Logo upload */}
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
                    setError("");
                    try {
                      const filename = await uploadLogo(file);
                      setForm((f) => ({ ...f, logoFile: filename }));
                    } catch {
                      setError("Failed to upload logo");
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
          <button
            type="submit"
            disabled={submitting || logoUploading}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create Company"}
          </button>
        </form>
      )}

      {/* Companies Table */}
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
                  No companies yet. Add one above.
                </td>
              </tr>
            )}
            {companies.map((company) => (
              <tr key={company._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-800 dark:text-white">
                    {company.name}
                  </div>
                  <div className="text-xs text-gray-400">{company.email}</div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      company.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {company.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {company.userCount}
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {company.invoiceCount}
                </td>
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
                    <button
                      onClick={() => handleDelete(company._id, company.name)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
