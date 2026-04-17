// client/src/pages/CompanyDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserPlus, CheckCircle, XCircle, Clock, IndianRupee, ReceiptText } from "lucide-react";
import API from "../api/api";
import InvoicePreviewModal from "../components/InvoicePreviewModal";
import EditUserModal from "../components/EditUserModal";
import CompanyProfileTab from "../components/CompanyProfileTab";
import CreateUserModal from "../components/CreateUserModal";
import DeleteUserModal from "../components/DeleteUserModal";
import ActivateSubscriptionModal from "../components/ActivateSubscriptionModal";
import DeactivateModal from "../components/DeactivateModal";
import ActivateCompanyModal from "../components/ActivateCompanyModal";


export default function CompanyDetail() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showActivate, setShowActivate] = useState(false);
  const [showDeactivate, setShowDeactivate] = useState(false);
  const [showActivateCompany, setShowActivateCompany] = useState(false);

  const fetchSubscription = async () => {
    try {
      const [statusRes, txRes] = await Promise.all([
        API.get(`/subscription/companies/${id}/status`),
        API.get(`/subscription/companies/${id}/transactions`),
      ]);
      setSubscriptionStatus(statusRes.data.data);
      setTransactions(txRes.data.data);
    } catch {
      // non-critical
    }
  };

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

    fetchSubscription();
  }, [id]);

  useEffect(() => {
    if (!editSuccess) return;
    const timer = setTimeout(() => setEditSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [editSuccess]);

  const handleConfirmDeleteUser = async (userId) => {
    setDeleting(true);
    try {
      await API.delete(`/auth/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setEditSuccess("User deleted successfully!");
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleActivated = (updatedCompany) => {
    setCompany(updatedCompany);
    setShowActivate(false);
    fetchSubscription();
    setEditSuccess("Subscription activated successfully!");
  };

  const handleDeactivated = (updatedCompany) => {
    setCompany(updatedCompany);
    setShowDeactivate(false);
    fetchSubscription();
    setEditSuccess("Company deactivated.");
  };

  const handleActivatedCompany = (updatedCompany) => {
    setCompany(updatedCompany);
    setShowActivateCompany(false);
    setEditSuccess("Company activated.");
  };

  const handleToggleDownloads = async () => {
    try {
      const res = await API.patch(`/subscription/companies/${id}/toggle-downloads`);
      setCompany((prev) => ({ ...prev, downloadsBlocked: res.data.data.downloadsBlocked }));
      fetchSubscription();
      setEditSuccess(res.data.message);
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to toggle downloads");
    }
  };

  const handleToggleInvoices = async () => {
    try {
      const res = await API.patch(`/subscription/companies/${id}/toggle-invoices`);
      setCompany((prev) => ({ ...prev, invoicesBlocked: res.data.data.invoicesBlocked }));
      setEditSuccess(res.data.message);
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to toggle invoices");
    }
  };

  const handleToggleLogin = async () => {
    try {
      const res = await API.patch(`/subscription/companies/${id}/toggle-login`);
      setCompany((prev) => ({ ...prev, loginBlocked: res.data.data.loginBlocked }));
      setEditSuccess(res.data.message);
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to toggle login");
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!company)
    return <p className="text-center text-red-500 mt-8">Company not found.</p>;

  const sub = subscriptionStatus;
  const daysUntilExpiry = sub?.daysUntilExpiry;
  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

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
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {[
          { key: "users", label: "Users", count: users.length },
          { key: "invoices", label: "Invoices", count: invoices.length },
          { key: "subscription", label: "Subscription", count: null },
          { key: "company-profile", label: "Company Profile", count: null },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setPreviewInvoice(null); setEditingUser(null); setShowCreateUser(false); }}
            className={`px-5 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
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
              onClick={() => { setShowCreateUser(true); setEditingUser(null); }}
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
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {users.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No users yet.</td></tr>
                )}
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        u.role === "company_admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setEditingUser(u); setShowCreateUser(false); }}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors">
                          Edit
                        </button>
                        <button type="button" onClick={() => { setDeleteTarget(u); setEditingUser(null); setShowCreateUser(false); }}
                          className="px-3 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors">
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
      )}

      {/* Invoices Tab */}
      {tab === "invoices" && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                {["Client", "Amount", "Type", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {invoices.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No invoices yet.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{inv.client?.name || "—"}</td>
                  <td className="px-4 py-3 text-green-600 dark:text-green-400 font-medium">₹{(inv.finalPayableAfterDiscount || 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.invoiceType}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button type="button" onClick={() => setPreviewInvoice(inv)}
                      className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors">
                      Preview
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Subscription Tab */}
      {tab === "subscription" && (
        <div className="space-y-5">
          {/* Subscription Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Subscription</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Expiry Date</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {company.subscriptionExpiryDate
                    ? new Date(company.subscriptionExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </p>
                {daysUntilExpiry !== null && daysUntilExpiry !== undefined && (
                  <p className={`text-xs mt-0.5 ${daysUntilExpiry > 7 ? "text-green-600 dark:text-green-400" : daysUntilExpiry > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                    {daysUntilExpiry > 0 ? `${daysUntilExpiry}d remaining` : "Expired"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Amount</p>
                <p className="text-sm font-medium text-gray-800 dark:text-white mt-1 flex items-center gap-1">
                  <IndianRupee className="w-3 h-3 text-gray-400" />
                  {company.subscriptionAmount != null
                    ? Number(company.subscriptionAmount).toLocaleString("en-IN")
                    : sub?.platformAmount
                      ? `${Number(sub.platformAmount).toLocaleString("en-IN")} (platform default)`
                      : "—"}
                </p>
              </div>
              {sub && sub.subscriptionState !== "no_subscription" && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
                  <span className={`inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    sub.subscriptionState === "active" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : sub.subscriptionState === "warning" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {sub.subscriptionState === "active" && "Active"}
                    {sub.subscriptionState === "warning" && `Expires in ${sub.daysUntilExpiry}d`}
                    {sub.subscriptionState === "expired" && "Expired"}
                  </span>
                </div>
              )}
            </div>

            {sub?.upiQrFile && (
              <div className="mb-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">UPI QR Code for Payment</p>
                <img
                  src={`${API_BASE}/public/${sub.upiQrFile}`}
                  alt="UPI QR"
                  className="w-32 h-32 object-contain border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-1"
                />
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowActivate(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                {company.isActive ? "Renew Subscription" : "Activate Subscription"}
              </button>
            </div>
          </div>

          {/* Company Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Company Status</h3>
            <div className="flex items-center gap-3 mb-4">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                company.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
              }`}>
                {company.isActive ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                {company.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {company.inactiveRemarks && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Reason:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">{company.inactiveRemarks}</p>
              </div>
            )}

            <div className="flex gap-3 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-700">
              {!company.isActive && (
                <button
                  onClick={() => setShowActivateCompany(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Activate Company
                </button>
              )}
              {company.isActive && (
                <button
                  onClick={() => setShowDeactivate(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  Deactivate Company
                </button>
              )}
            </div>
          </div>

          {/* Access Controls Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Access Controls</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Create / Edit / Compare</p>
                  <p className={`text-xs mt-0.5 ${!company.invoicesBlocked ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {company.invoicesBlocked ? "Blocked" : "Allowed"}
                  </p>
                </div>
                <button
                  onClick={handleToggleInvoices}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    company.invoicesBlocked
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  {company.invoicesBlocked ? "Unblock" : "Block"}
                </button>
              </div>

              <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Invoice Downloads</p>
                  <p className={`text-xs mt-0.5 ${!company.downloadsBlocked ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {company.downloadsBlocked ? "Blocked" : "Allowed"}
                  </p>
                </div>
                <button
                  onClick={handleToggleDownloads}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    company.downloadsBlocked
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  {company.downloadsBlocked ? "Unblock" : "Block"}
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Company Admin & User Login</p>
                  <p className={`text-xs mt-0.5 ${!company.loginBlocked ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {company.loginBlocked ? "Blocked" : "Allowed"}
                  </p>
                </div>
                <button
                  onClick={handleToggleLogin}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                    company.loginBlocked
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "bg-orange-600 hover:bg-orange-700 text-white"
                  }`}
                >
                  {company.loginBlocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>
          </div>

          {/* Subscription Payments Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <ReceiptText className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Subscription Payments</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {["Date", "Amount", "Mode of Payment", "Valid Till"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {transactions.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No subscription payments yet.</td></tr>
                )}
                {transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium">
                      {tx.amount != null ? `₹${Number(tx.amount).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {tx.modeOfPayment || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {tx.expiryDate ? new Date(tx.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <InvoicePreviewModal invoice={previewInvoice} company={company} onClose={() => setPreviewInvoice(null)} />
      )}

      {showCreateUser && (
        <CreateUserModal
          companyId={id}
          onSave={(newUser) => { setUsers((prev) => [...prev, newUser]); setShowCreateUser(false); setEditSuccess("User created successfully!"); }}
          onClose={() => setShowCreateUser(false)}
        />
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={(updated) => { setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u))); setEditingUser(null); setEditSuccess("User updated successfully!"); }}
          onClose={() => setEditingUser(null)}
        />
      )}

      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onConfirm={handleConfirmDeleteUser}
          onClose={() => { if (!deleting) setDeleteTarget(null); }}
          deleting={deleting}
        />
      )}

      {showActivate && (
        <ActivateSubscriptionModal
          companyId={id}
          companyName={company.name}
          currentAmount={company.subscriptionAmount}
          platformAmount={sub?.platformAmount}
          onSave={handleActivated}
          onClose={() => setShowActivate(false)}
        />
      )}

      {showDeactivate && (
        <DeactivateModal
          companyId={id}
          companyName={company.name}
          onSave={handleDeactivated}
          onClose={() => setShowDeactivate(false)}
        />
      )}

      {showActivateCompany && (
        <ActivateCompanyModal
          companyId={id}
          companyName={company.name}
          onSave={handleActivatedCompany}
          onClose={() => setShowActivateCompany(false)}
        />
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4 z-50">
        {editSuccess && (
          <div className={`text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg ${editSuccess.includes("deactivated") || editSuccess.toLowerCase().includes("fail") ? "bg-amber-600" : "bg-green-600"}`}>
            {editSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
