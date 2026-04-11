import { useState, useContext, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import { Upload, CheckCircle, AlertCircle, ImageIcon } from "lucide-react";

const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function CompanyLogoChanger() {
  const { company, setCompany } = useContext(AuthContext);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [preview, setPreview] = useState(null);

  const logoUrl = company?.logoFile
    ? `${import.meta.env.VITE_API_BASE}/public/${company.logoFile}`
    : null;

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ type: "error", text: "Only JPEG, PNG, GIF, and WEBP images are allowed" });
      clearMessage();
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setMessage({ type: "error", text: `File size must be under ${MAX_SIZE_MB} MB` });
      clearMessage();
      return;
    }

    setPreview(URL.createObjectURL(file));
    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setUploading(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await api.post("/companies/my/logo", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const updatedCompany = res.data.data;
      setCompany(updatedCompany);
      localStorage.setItem("company", JSON.stringify(updatedCompany));
      setMessage({ type: "success", text: "Logo updated successfully!" });
      clearMessage();
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to upload logo",
      });
      clearMessage();
    } finally {
      setUploading(false);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const displayUrl = preview || logoUrl;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-6">
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Company Logo
            </h2>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Update your company logo (max {MAX_SIZE_MB} MB)
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Message */}
        {message.text && (
          <div
            className={`mb-4 p-3 rounded-lg border text-sm ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === "success" ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          {/* Logo Preview */}
          <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-50 dark:bg-gray-700">
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Company logo"
                className="w-full h-full object-contain"
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>

          {/* Upload Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
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
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              JPEG, PNG, GIF, or WEBP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
