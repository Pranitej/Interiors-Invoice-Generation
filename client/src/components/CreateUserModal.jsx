import { useEffect, useState } from "react";
import { Shield, User, X } from "lucide-react";
import api from "../api/api";
import config from "../config";

const ROLES = [
  {
    value: config.roles.COMPANY_ADMIN,
    label: "Company Admin",
    description: "Can manage users and company settings",
    Icon: Shield,
    color: "purple",
  },
  {
    value: config.roles.COMPANY_USER,
    label: "Standard User",
    description: "Can create and view invoices",
    Icon: User,
    color: "blue",
  },
];

export default function CreateUserModal({ companyId, onSave, onClose }) {
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: config.roles.COMPANY_USER,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await api.post("/auth/users", {
        username: form.username,
        password: form.password,
        role: form.role,
        companyId,
      });
      onSave(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            id="create-user-title"
            className="text-lg font-bold text-gray-900 dark:text-white"
          >
            Add User
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div aria-live="polite">
          {error && (
            <p className="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="create-user-username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="create-user-username"
                type="text"
                autoFocus
                autoComplete="username"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="create-user-password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
              >
                Password
              </label>
              <input
                id="create-user-password"
                type="password"
                autoComplete="new-password"
                minLength={4}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role
              </p>
              <div className="space-y-2">
                {ROLES.map(({ value, label, description, Icon, color }) => { // eslint-disable-line no-unused-vars
                  const selected = form.role === value;
                  return (
                    <label
                      key={value}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        selected
                          ? color === "purple"
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={selected}
                        onChange={() => setForm((f) => ({ ...f, role: value }))}
                        className="sr-only"
                      />
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          color === "purple"
                            ? "bg-purple-100 dark:bg-purple-900/40"
                            : "bg-blue-100 dark:bg-blue-900/40"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${
                            color === "purple"
                              ? "text-purple-600 dark:text-purple-400"
                              : "text-blue-600 dark:text-blue-400"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold ${
                            color === "purple"
                              ? "text-purple-700 dark:text-purple-300"
                              : "text-blue-700 dark:text-blue-300"
                          }`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {description}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selected
                            ? color === "purple"
                              ? "border-purple-500"
                              : "border-blue-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {selected && (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              color === "purple" ? "bg-purple-500" : "bg-blue-500"
                            }`}
                          />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 mt-6">
            <button
              type="submit"
              disabled={submitting}
              aria-disabled={submitting}
              className="flex-1 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                "Create User"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
