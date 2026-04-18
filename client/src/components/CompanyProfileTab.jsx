import { useEffect, useRef, useState } from "react";
import { ImageIcon, Plus, Save, Upload, X } from "lucide-react";
import api from "../api/api";
import config from "../config";

const MAX_LOGO_MB = 2;
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function CompanyProfileTab({ companyId, initialCompany, onUpdate }) {
  const [form, setForm] = useState({
    name: initialCompany?.name ?? "",
    tagline: initialCompany?.tagline ?? "",
    registeredOffice: initialCompany?.registeredOffice ?? "",
    industryAddress: initialCompany?.industryAddress ?? "",
    phones: Array.isArray(initialCompany?.phones) ? initialCompany.phones : [],
    email: initialCompany?.email ?? "",
    website: initialCompany?.website ?? "",
    termsAndConditions: Array.isArray(initialCompany?.termsAndConditions)
      ? initialCompany.termsAndConditions
      : [],
    logoFile: initialCompany?.logoFile ?? "",
    adminInvoiceTemplate: initialCompany?.adminInvoiceTemplate ?? 1,
    clientInvoiceTemplate: initialCompany?.clientInvoiceTemplate ?? 1,
    compareInvoiceTemplate: initialCompany?.compareInvoiceTemplate ?? 1,
  });
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!message.text) return;
    const timer = setTimeout(() => setMessage({ type: "", text: "" }), 5000);
    return () => clearTimeout(timer);
  }, [message.text]);

  useEffect(() => {
    if (!initialCompany) return;
    setForm({
      name: initialCompany.name ?? "",
      tagline: initialCompany.tagline ?? "",
      registeredOffice: initialCompany.registeredOffice ?? "",
      industryAddress: initialCompany.industryAddress ?? "",
      phones: Array.isArray(initialCompany.phones) ? initialCompany.phones : [],
      email: initialCompany.email ?? "",
      website: initialCompany.website ?? "",
      termsAndConditions: Array.isArray(initialCompany.termsAndConditions)
        ? initialCompany.termsAndConditions
        : [],
      logoFile: initialCompany.logoFile ?? "",
      adminInvoiceTemplate: initialCompany.adminInvoiceTemplate ?? 1,
      clientInvoiceTemplate: initialCompany.clientInvoiceTemplate ?? 1,
      compareInvoiceTemplate: initialCompany.compareInvoiceTemplate ?? 1,
    });
  }, [initialCompany]);

  const logoUrl = form.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${form.logoFile}`
    : null;

  const handleLogoSelect = async (file) => {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Only JPEG, PNG, GIF, and WEBP images are allowed" });
      return;
    }
    if (file.size > MAX_LOGO_MB * 1024 * 1024) {
      setMessage({ type: "error", text: `Logo must be under ${MAX_LOGO_MB} MB` });
      return;
    }
    setLogoUploading(true);
    setMessage({ type: "", text: "" });
    try {
      const formData = new FormData();
      formData.append("logo", file);
      const uploadRes = await api.post("/upload/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newLogoFile = uploadRes.data.data.filename;
      const saveRes = await api.put(`/companies/${companyId}`, { ...form, logoFile: newLogoFile });
      setForm((f) => ({ ...f, logoFile: newLogoFile }));
      onUpdate(saveRes.data.data);
      setMessage({ type: "success", text: "Logo updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update logo" });
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });
    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Company name is required" });
      return;
    }
    if (form.termsAndConditions.length > config.company.maxTerms) {
      setMessage({ type: "error", text: `Maximum ${config.company.maxTerms} terms allowed` });
      return;
    }
    setSaving(true);
    try {
      const res = await api.put(`/companies/${companyId}`, form);
      onUpdate(res.data.data);
      setMessage({ type: "success", text: "Company updated successfully!" });
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to update company" });
    } finally {
      setSaving(false);
    }
  };

  const setPhone = (idx, val) =>
    setForm((f) => {
      const updated = [...f.phones];
      updated[idx] = val;
      return { ...f, phones: updated };
    });
  const removePhone = (idx) =>
    setForm((f) => ({ ...f, phones: f.phones.filter((_, i) => i !== idx) }));
  const addPhone = () => setForm((f) => ({ ...f, phones: [...f.phones, ""] }));

  const setTerm = (idx, val) =>
    setForm((f) => {
      const updated = [...f.termsAndConditions];
      updated[idx] = val;
      return { ...f, termsAndConditions: updated };
    });
  const removeTerm = (idx) =>
    setForm((f) => ({ ...f, termsAndConditions: f.termsAndConditions.filter((_, i) => i !== idx) }));
  const addTerm = () =>
    setForm((f) => ({ ...f, termsAndConditions: [...f.termsAndConditions, ""] }));

  return (
    <div className="space-y-5">
      {/* Inline message */}
      <div role="status" aria-live="polite" aria-atomic="true">
        {message.text && (
          <div
            className={`p-3 rounded-lg border text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            <span className="font-medium">{message.text}</span>
          </div>
        )}
      </div>

      {/* Logo card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Logo</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Select an image to instantly update the logo (max {MAX_LOGO_MB} MB)
              </p>
            </div>
          </div>
        </div>
        <div className="p-5 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
            {logoUrl ? (
              <img src={logoUrl} alt="Company logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              id="company-logo-input"
              onChange={(e) => handleLogoSelect(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={logoUploading}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {logoUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Change Logo
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">JPEG, PNG, GIF, or WEBP</p>
          </div>
        </div>
      </div>

      {/* Details form card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Save className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Company Details</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Update company information and terms
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-5">
            {/* Company Name */}
            <div>
              <label
                htmlFor="cp-name"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                id="cp-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                required
              />
            </div>

            {/* Tagline */}
            <div>
              <label
                htmlFor="cp-tagline"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Tagline
              </label>
              <input
                id="cp-tagline"
                type="text"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Registered Office */}
            <div>
              <label
                htmlFor="cp-reg-office"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Registered Office
              </label>
              <input
                id="cp-reg-office"
                type="text"
                value={form.registeredOffice}
                onChange={(e) => setForm((f) => ({ ...f, registeredOffice: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Industry Address */}
            <div>
              <label
                htmlFor="cp-ind-address"
                className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
              >
                Industry Address{" "}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
              </label>
              <input
                id="cp-ind-address"
                type="text"
                value={form.industryAddress}
                onChange={(e) => setForm((f) => ({ ...f, industryAddress: e.target.value }))}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
              />
            </div>

            {/* Email & Website */}
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cp-email"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
                >
                  Email
                </label>
                <input
                  id="cp-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="cp-website"
                  className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5"
                >
                  Website
                </label>
                <input
                  id="cp-website"
                  type="text"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </div>

            {/* Phones */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                Phone Numbers
              </label>
              <div className="space-y-2">
                {form.phones.map((phone, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      id={`cp-phone-${idx}`}
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder="Phone number"
                    />
                    <button
                      type="button"
                      onClick={() => removePhone(idx)}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label={`Remove phone ${idx + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPhone}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Add Phone
                </button>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                  Terms &amp; Conditions
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {form.termsAndConditions.length} / {config.company.maxTerms}
                </span>
              </div>
              <div className="space-y-2">
                {form.termsAndConditions.map((term, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      id={`cp-term-${idx}`}
                      type="text"
                      value={term}
                      onChange={(e) => setTerm(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      placeholder={`Term ${idx + 1}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeTerm(idx)}
                      className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      aria-label={`Remove term ${idx + 1}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  disabled={form.termsAndConditions.length >= config.company.maxTerms}
                  onClick={addTerm}
                  className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Add Term
                </button>
              </div>
            </div>

            {/* Invoice Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Invoice Templates</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Choose the design theme for each invoice type</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-6">
                {[
                  { key: "adminInvoiceTemplate", label: "Admin Invoice" },
                  { key: "clientInvoiceTemplate", label: "Client Invoice" },
                  { key: "compareInvoiceTemplate", label: "Compare Invoice" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{label}</p>
                    <div className="flex gap-3 flex-wrap">
                      {[
                        { num: 1, name: "Classic Professional", swatches: ["#f3f4f6", "#d1d5db", "#1f2937"] },
                        { num: 2, name: "Executive Navy", swatches: ["#0f172a", "#d97706", "#ffffff"] },
                        { num: 3, name: "Modern Teal", swatches: ["#0d9488", "#f0fdfa", "#ffffff"] },
                      ].map(({ num, name, swatches }) => {
                        const selected = form[key] === num;
                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, [key]: num }))}
                            className={`flex flex-col items-start p-3 rounded-lg border-2 transition-all w-40 ${
                              selected
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                            }`}
                          >
                            <div className="flex gap-1.5 mb-2">
                              {swatches.map((c, i) => (
                                <div
                                  key={i}
                                  style={{ backgroundColor: c }}
                                  className="w-5 h-5 rounded border border-gray-200"
                                />
                              ))}
                            </div>
                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                              Template {num}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={saving || logoUploading}
                aria-disabled={saving || logoUploading}
                className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
