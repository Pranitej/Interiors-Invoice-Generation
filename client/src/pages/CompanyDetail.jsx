// client/src/pages/CompanyDetail.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { UserPlus, CheckCircle, XCircle, Clock, IndianRupee, ReceiptText, Trash2, Edit2, Save, X, ZoomIn, AlertCircle } from "lucide-react";
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
  const [tab, setTab] = useState("subscription");
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
  const [deleteTx, setDeleteTx] = useState(null);
  const [deletingTx, setDeletingTx] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [editTxForm, setEditTxForm] = useState({});
  const [savingTx, setSavingTx] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState("");
  const [savingRate, setSavingRate] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [expiryInput, setExpiryInput] = useState("");
  const [savingExpiry, setSavingExpiry] = useState(false);

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
        setInvoices(invoicesRes.data.data?.invoices ?? invoicesRes.data.data ?? []);
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
    setEditSuccess("Company suspended.");
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

  const handleSaveRate = async () => {
    const parsed = Number(rateInput);
    if (isNaN(parsed) || parsed < 0) {
      setEditSuccess("Invalid amount.");
      return;
    }
    setSavingRate(true);
    try {
      const res = await API.patch(`/subscription/companies/${id}/amount`, { amount: parsed });
      setCompany((prev) => ({ ...prev, subscriptionAmount: res.data.data.subscriptionAmount }));
      setEditingRate(false);
      setEditSuccess("Company rate updated.");
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to update rate.");
    } finally {
      setSavingRate(false);
    }
  };

  const handleSaveExpiry = async () => {
    if (!expiryInput) {
      setEditSuccess("Expiry date is required.");
      return;
    }
    setSavingExpiry(true);
    try {
      const res = await API.patch(`/subscription/companies/${id}/expiry`, { expiryDate: expiryInput });
      const { subscriptionExpiryDate, isActive, inactiveRemarks } = res.data.data;
      setCompany((prev) => ({ ...prev, subscriptionExpiryDate, isActive, inactiveRemarks }));
      setEditingExpiry(false);
      fetchSubscription();
      setEditSuccess("Expiry date updated.");
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to update expiry date.");
    } finally {
      setSavingExpiry(false);
    }
  };

  const handleDeleteTransaction = async () => {
    if (!deleteTx) return;
    setDeletingTx(true);
    try {
      await API.delete(`/subscription/transactions/${deleteTx._id}`);
      setTransactions((prev) => prev.filter((t) => t._id !== deleteTx._id));
      setEditSuccess("Transaction deleted.");
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to delete transaction.");
    } finally {
      setDeletingTx(false);
      setDeleteTx(null);
    }
  };

  const openEditTx = (tx) => {
    setEditTx(tx);
    setEditTxForm({
      amount: tx.amount ?? "",
      modeOfPayment: tx.modeOfPayment ?? "",
      remarks: tx.remarks ?? "",
    });
  };

  const handleSaveEditTx = async () => {
    if (!editTx) return;
    setSavingTx(true);
    try {
      const payload = {
        amount: editTxForm.amount !== "" ? Number(editTxForm.amount) : null,
        modeOfPayment: editTxForm.modeOfPayment || null,
        remarks: editTxForm.remarks,
      };
      const res = await API.patch(`/subscription/transactions/${editTx._id}`, payload);
      setTransactions((prev) => prev.map((t) => (t._id === editTx._id ? res.data.data : t)));
      setEditSuccess("Transaction updated.");
      setEditTx(null);
    } catch (err) {
      setEditSuccess(err?.response?.data?.message || "Failed to update transaction.");
    } finally {
      setSavingTx(false);
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
            {company.isActive ? "Active" : "Suspended"}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto overflow-y-hidden">
        {[
          { key: "subscription", label: "Subscription", count: null },
          { key: "company-profile", label: "Company Profile", count: null },
          { key: "users", label: "Users", count: users.length },
          { key: "invoices", label: "Invoices", count: invoices.length },
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
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expiry Date</p>
                {editingExpiry ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="date"
                      value={expiryInput}
                      onChange={(e) => setExpiryInput(e.target.value)}
                      className="w-36 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveExpiry}
                      disabled={savingExpiry}
                      className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      {savingExpiry
                        ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingExpiry(false)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {company.subscriptionExpiryDate
                        ? new Date(company.subscriptionExpiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                        : "—"}
                    </p>
                    <button
                      onClick={() => {
                        const d = company.subscriptionExpiryDate
                          ? new Date(company.subscriptionExpiryDate).toISOString().slice(0, 10)
                          : "";
                        setExpiryInput(d);
                        setEditingExpiry(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit expiry date"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {!editingExpiry && daysUntilExpiry !== null && daysUntilExpiry !== undefined && (
                  <p className={`text-xs mt-0.5 ${daysUntilExpiry > 7 ? "text-green-600 dark:text-green-400" : daysUntilExpiry > 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                    {daysUntilExpiry > 0 ? `${daysUntilExpiry}d remaining` : "Expired"}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Company Rate</p>
                {editingRate ? (
                  <div className="flex items-center gap-1.5">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={rateInput}
                        onChange={(e) => setRateInput(e.target.value)}
                        className="w-32 pl-6 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        autoFocus
                      />
                    </div>
                    <button
                      onClick={handleSaveRate}
                      disabled={savingRate}
                      className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md transition-colors disabled:opacity-50"
                      title="Save"
                    >
                      {savingRate
                        ? <div className="w-3.5 h-3.5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => setEditingRate(false)}
                      className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                      title="Cancel"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-800 dark:text-white flex items-center gap-1">
                      <IndianRupee className="w-3 h-3 text-gray-400" />
                      {company.subscriptionAmount != null
                        ? Number(company.subscriptionAmount).toLocaleString("en-IN")
                        : sub?.platformAmount
                          ? `${Number(sub.platformAmount).toLocaleString("en-IN")} (platform default)`
                          : "—"}
                    </p>
                    <button
                      onClick={() => {
                        setRateInput(String(company.subscriptionAmount ?? sub?.platformAmount ?? ""));
                        setEditingRate(true);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                      title="Edit company rate"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {!editingRate && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {company.subscriptionAmount != null ? "custom rate" : "using platform default"}
                  </p>
                )}
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
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="group relative w-32 h-32 border border-gray-200 dark:border-gray-600 rounded-lg bg-white p-1 hover:border-blue-400 dark:hover:border-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Click to enlarge"
                >
                  <img
                    src={`${API_BASE}/public/${sub.upiQrFile}`}
                    alt="UPI QR"
                    className="w-full h-full object-contain"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-black/30 rounded-lg transition-colors">
                    <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                  </span>
                </button>
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
                {company.isActive ? "Active" : "Suspended"}
              </span>
            </div>

            {company.inactiveRemarks && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-4">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Reason:</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-0.5">{company.inactiveRemarks}</p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              {sub?.subscriptionState === "expired" || sub?.subscriptionState === "no_subscription" || !sub ? (
                <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                  Activate/suspend is unavailable — renew the subscription first.
                </p>
              ) : (
                <div className="flex gap-3 flex-wrap">
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
                      Suspend Company
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Access Controls Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Access Controls</h3>
            <div className="space-y-3">
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
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {["Date", "Amount", "Mode of Payment", "Remarks", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transactions.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No subscription payments yet.</td></tr>
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
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 max-w-xs">
                        {tx.remarks || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditTx(tx)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            title="Edit transaction"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTx(tx)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                            title="Delete transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
          currentExpiryDate={company.subscriptionExpiryDate}
          isCurrentlyActive={company.isActive}
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

      {/* UPI QR Popup Modal */}
      {showQrModal && sub?.upiQrFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setShowQrModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full flex flex-col items-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between w-full">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">UPI Payment QR</h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <img
              src={`${API_BASE}/public/${sub.upiQrFile}`}
              alt="UPI QR Code"
              className="w-64 h-64 object-contain border border-gray-200 dark:border-gray-600 rounded-xl bg-white p-3"
            />
            {(company.subscriptionAmount != null || sub.platformAmount) && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <IndianRupee className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-base font-bold text-green-700 dark:text-green-300">
                  {Number(company.subscriptionAmount ?? sub.platformAmount).toLocaleString("en-IN")}
                </span>
                <span className="text-sm text-green-600 dark:text-green-400">
                  {company.subscriptionAmount != null ? "company rate" : "platform rate"}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-md w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit Transaction</h3>
              <button onClick={() => setEditTx(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={editTxForm.amount}
                  onChange={(e) => setEditTxForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Leave blank for none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mode of Payment</label>
                <select
                  value={editTxForm.modeOfPayment}
                  onChange={(e) => setEditTxForm((f) => ({ ...f, modeOfPayment: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">— None —</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={editTxForm.remarks}
                  onChange={(e) => setEditTxForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Optional remarks"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEditTx(null)}
                disabled={savingTx}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditTx}
                disabled={savingTx}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {savingTx ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {deleteTx && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 max-w-sm w-full shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="mx-auto w-11 h-11 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Delete transaction?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                {new Date(deleteTx.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                {deleteTx.amount != null && ` · ₹${Number(deleteTx.amount).toLocaleString("en-IN")}`}
                {deleteTx.modeOfPayment && ` · ${deleteTx.modeOfPayment}`}
              </p>
              {deleteTx.remarks && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 italic">&quot;{deleteTx.remarks}&quot;</p>
              )}
              <p className="text-xs text-red-600 dark:text-red-400 mb-4">This cannot be undone.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setDeleteTx(null)}
                  disabled={deletingTx}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
                  disabled={deletingTx}
                  className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {deletingTx ? (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite" aria-atomic="true" className="fixed bottom-4 right-4 z-50">
        {editSuccess && (
          <div className={`text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg ${editSuccess.includes("suspended") || editSuccess.toLowerCase().includes("fail") ? "bg-amber-600" : "bg-green-600"}`}>
            {editSuccess}
          </div>
        )}
      </div>
    </div>
  );
}
