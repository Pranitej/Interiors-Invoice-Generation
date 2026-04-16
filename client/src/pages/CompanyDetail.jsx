// client/src/pages/CompanyDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
import CompanyProfileTab from "../components/CompanyProfileTab";
import CreateUserModal from "../components/CreateUserModal";

export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);

  useEffect(() => {
    Promise.all([
      API.get(`/companies/${id}`),
      API.get(`/super-admin/companies/${id}/users`),
      API.get(`/super-admin/companies/${id}/invoices`),
    ])
      .then(([companyRes, usersRes, invoicesRes]) => {
        setCompany(companyRes.data.data);
        setUsers(usersRes.data.data);
        setInvoices(invoicesRes.data.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!editSuccess) return;
    const timer = setTimeout(() => setEditSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [editSuccess]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!company)
    return <p className="text-center text-red-500 mt-8">Company not found.</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/dashboard"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {company.name}
          </h1>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
              company.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {company.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "users", label: "Users", count: users.length },
          { key: "invoices", label: "Invoices", count: invoices.length },
          { key: "company-profile", label: "Company Profile", count: null },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); setShowCreateUser(false); }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === key
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {label}{count !== null ? ` (${count})` : ""}
          </button>
        ))}
      </div>

      {/* Users Tab */}
      {tab === "users" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Users ({users.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowCreateUser(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Username", "Role", "Created", "Actions"].map((h) => (
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
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {u.username}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "company_admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label={`Edit user ${u.username}`}
                      onClick={() => setEditingUser(u)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Client", "Amount", "Type", "Date", "Actions"].map((h) => (
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
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                    No invoices yet.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                    {inv.client?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">
                    ₹{(inv.finalPayableAfterDiscount || 0).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {inv.invoiceType}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setPreviewInvoice(inv)}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors"
                    >
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Profile Tab */}
      {tab === "company-profile" && (
        <CompanyProfileTab
          companyId={id}
          initialCompany={company}
          onUpdate={(updated) => setCompany(updated)}
        />
      )}

      {previewInvoice && (
        <InvoicePreviewModal
          invoice={previewInvoice}
          company={company}
          onClose={() => setPreviewInvoice(null)}
        />
      )}

      {showCreateUser && (
        <CreateUserModal
          companyId={id}
          onSave={(newUser) => {
            setUsers((prev) => [...prev, newUser]);
            setShowCreateUser(false);
            setEditSuccess("User created successfully!");
          }}
          onClose={() => setShowCreateUser(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
            setEditingUser(null);
            setEditSuccess("User updated successfully!");
          }}
          onClose={() => setEditingUser(null)}
        />
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4 z-50">
        {editSuccess && (
          <div className="bg-green-600 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg">
            {editSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
