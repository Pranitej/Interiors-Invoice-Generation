// src/pages/ProfilePage.jsx
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/api";
import {
  User,
  Lock,
  Shield,
  CheckCircle,
  AlertCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Save,
  X,
  Users,
  Settings,
  Key,
  UserPlus,
  Calendar,
  IdCard,
  Building2,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatISTDateTime } from "../utils/dateTime";
import config from "../config.js";
import CompanyLogoChanger from "../components/CompanyLogoChanger";
import EditUserModal from "../components/EditUserModal";
import DeleteUserModal from "../components/DeleteUserModal";

export default function Profile() {
  const { user: currentUser, setUser: setCurrentUser, setCompany } =
    useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type: "", text: "" });

  // User profile state
  const [profileForm, setProfileForm] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Admin user management state
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    role: config.roles.COMPANY_USER,
  });
  const [editingUser, setEditingUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [companyForm, setCompanyForm] = useState({
    name: "",
    tagline: "",
    registeredOffice: "",
    industryAddress: "",
    phones: [],
    email: "",
    website: "",
    termsAndConditions: [],
  });
  const [companyLoading, setCompanyLoading] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
    newUser: false,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/");
      return;
    }

    // Load current user profile
    setProfileForm({
      username: currentUser.username,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

    // Load all users if admin
    if (currentUser.role === config.roles.COMPANY_ADMIN) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage({ type: "error", text: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompany = async () => {
    try {
      const response = await api.get("/companies/my");
      const c = response.data.data;
      setCompanyForm({
        name: c.name || "",
        tagline: c.tagline || "",
        registeredOffice: c.registeredOffice || "",
        industryAddress: c.industryAddress || "",
        phones: Array.isArray(c.phones) ? c.phones : [],
        email: c.email || "",
        website: c.website || "",
        termsAndConditions: Array.isArray(c.termsAndConditions) ? c.termsAndConditions : [],
      });
    } catch (error) {
      console.error("Failed to fetch company:", error);
      setMessage({ type: "error", text: "Failed to load company details" });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate password change
    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setMessage({ type: "error", text: "New passwords do not match" });
        return;
      }
      if (profileForm.newPassword.length < 4) {
        setMessage({
          type: "error",
          text: "Password must be at least 4 characters",
        });
        return;
      }
    }

    try {
      const payload = {
        username: profileForm.username,
        ...(profileForm.newPassword && {
          password: profileForm.newPassword, // ✅ ONLY send password
        }),
      };

      const response = await api.put(`/auth/users/${currentUser._id}`, payload);

      setCurrentUser(response.data.data);
      localStorage.setItem("user", JSON.stringify(response.data.data));

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      setProfileForm({
        ...profileForm,
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Update failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile",
      });
    }
  };

  const handleCreateUser = async (e) => {
    e?.preventDefault();
    setMessage({ type: "", text: "" });

    if (!newUserForm.username.trim()) {
      setMessage({ type: "error", text: "Username is required" });
      return;
    }

    if (newUserForm.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      const response = await api.post("/auth/users", {
        ...newUserForm,
        role: config.roles.COMPANY_USER,
      });

      if (!response.data.success) {
        setMessage({
          type: "error",
          text: response.data.message || "Failed to create user",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "User created successfully!",
      });

      setNewUserForm({ username: "", password: "", role: config.roles.COMPANY_USER });
      setShowCreateUserModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Create user failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create user",
      });
    }
  };

  const handleDeleteUser = (user) => {
    if (user._id === currentUser._id) {
      setMessage({ type: "error", text: "Cannot delete your own account" });
      return;
    }
    setDeleteTarget(user);
  };

  const confirmDeleteUser = async (userId) => {
    setDeleting(true);
    try {
      await api.delete(`/auth/users/${userId}`);
      setMessage({ type: "success", text: "User deleted successfully!" });
      fetchUsers();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete user",
      });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (!companyForm.name.trim()) {
      setMessage({ type: "error", text: "Company name is required" });
      return;
    }

    if (companyForm.termsAndConditions.length > config.company.maxTerms) {
      setMessage({ type: "error", text: `Maximum ${config.company.maxTerms} terms allowed` });
      return;
    }

    try {
      setCompanyLoading(true);
      const response = await api.put("/companies/my", companyForm);
      const updatedCompany = response.data.data;
      setCompany(updatedCompany);
      localStorage.setItem("company", JSON.stringify(updatedCompany));
      setMessage({ type: "success", text: "Company details updated successfully!" });
    } catch (error) {
      console.error("Company update failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update company details",
      });
    } finally {
      setCompanyLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword({
      ...showPassword,
      [field]: !showPassword[field],
    });
  };

  const clearMessage = () => {
    setTimeout(() => setMessage({ type: "", text: "" }), 5000);
  };

  useEffect(() => {
    if (message.text) {
      clearMessage();
    }
  }, [message]);

  const tabs = [
    { id: "profile", label: "My Profile", icon: User, color: "blue" },
    ...(currentUser?.role === config.roles.COMPANY_ADMIN
      ? [
          { id: "company", label: "Company", icon: Building2, color: "indigo" },
          { id: "users", label: "Manage Users", icon: Users, color: "purple" },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-12 h-12 border-3 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <h2 className="text-base font-bold text-gray-800 dark:text-white mb-2">
            Loading Profile...
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please wait a moment
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            Account Settings
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage your profile and account preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div className="space-y-0.5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === "company") fetchCompany();
                    }}
                    className={`w-full flex cursor-pointer items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm ${
                      activeTab === tab.id
                        ? `bg-${tab.color}-50 dark:bg-${tab.color}-900/20 text-${tab.color}-600 dark:text-${tab.color}-400 border border-${tab.color}-200 dark:border-${tab.color}-800`
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* User Info Card */}
              <div className="mt-6 pt-5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {currentUser?.username}
                    </h3>
                    <div className="flex items-center gap-1">
                      {currentUser?.role === config.roles.SUPER_ADMIN ? (
                        <>
                          <Shield className="w-3 h-3 text-amber-500" />
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            Super Admin
                          </span>
                        </>
                      ) : currentUser?.role === config.roles.COMPANY_ADMIN ? (
                        <>
                          <Shield className="w-3 h-3 text-purple-500" />
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Administrator
                          </span>
                        </>
                      ) : (
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Standard User
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <IdCard className="w-3 h-3" />
                    <span className="truncate">
                      {currentUser?._id.slice(-10)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatISTDateTime(currentUser?.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Message Display */}
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

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Edit Profile
                      </h2>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Update your account information
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="p-5">
                  <div className="space-y-5">
                    {/* Username Field */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                        Username
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={profileForm.username}
                          onChange={(e) =>
                            setProfileForm({
                              ...profileForm,
                              username: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Change Section */}
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Key className="w-4 h-4" />
                        Change Password
                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                          (Optional)
                        </span>
                      </h3>

                      <div className="grid md:grid-cols-2 gap-3">
                        {/* New Password */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            New Password
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showPassword.new ? "text" : "password"}
                              value={profileForm.newPassword}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  newPassword: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility("new")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword.new ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Confirm Password
                          </label>
                          <div className="relative">
                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                              <Lock className="w-4 h-4" />
                            </div>
                            <input
                              type={showPassword.confirm ? "text" : "password"}
                              value={profileForm.confirmPassword}
                              onChange={(e) =>
                                setProfileForm({
                                  ...profileForm,
                                  confirmPassword: e.target.value,
                                })
                              }
                              className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                togglePasswordVisibility("confirm")
                              }
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword.confirm ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="w-full md:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
              </>
            )}

            {/* Company Tab */}
            {activeTab === "company" && currentUser?.role === config.roles.COMPANY_ADMIN && (
              <div className="space-y-5">
                <CompanyLogoChanger />

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Company Details
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Update your company information and terms
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleCompanyUpdate} className="p-5">
                    <div className="space-y-5">
                      {/* Company Name */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Company Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={companyForm.name}
                          onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          required
                        />
                      </div>

                      {/* Tagline */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Tagline
                        </label>
                        <input
                          type="text"
                          value={companyForm.tagline}
                          onChange={(e) => setCompanyForm({ ...companyForm, tagline: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Registered Office */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Registered Office
                        </label>
                        <input
                          type="text"
                          value={companyForm.registeredOffice}
                          onChange={(e) => setCompanyForm({ ...companyForm, registeredOffice: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Industry Address (optional) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                          Industry Address
                          <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={companyForm.industryAddress}
                          onChange={(e) => setCompanyForm({ ...companyForm, industryAddress: e.target.value })}
                          className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                        />
                      </div>

                      {/* Email & Website */}
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                            Email
                          </label>
                          <input
                            type="email"
                            value={companyForm.email}
                            onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                            className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                            Website
                          </label>
                          <input
                            type="text"
                            value={companyForm.website}
                            onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
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
                          {companyForm.phones.map((phone, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={phone}
                                onChange={(e) => {
                                  const updated = [...companyForm.phones];
                                  updated[idx] = e.target.value;
                                  setCompanyForm({ ...companyForm, phones: updated });
                                }}
                                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder="Phone number"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = companyForm.phones.filter((_, i) => i !== idx);
                                  setCompanyForm({ ...companyForm, phones: updated });
                                }}
                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => setCompanyForm({ ...companyForm, phones: [...companyForm.phones, ""] })}
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
                            {companyForm.termsAndConditions.length} / {config.company.maxTerms}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {companyForm.termsAndConditions.map((term, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input
                                type="text"
                                value={term}
                                onChange={(e) => {
                                  const updated = [...companyForm.termsAndConditions];
                                  updated[idx] = e.target.value;
                                  setCompanyForm({ ...companyForm, termsAndConditions: updated });
                                }}
                                className="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                                placeholder={`Term ${idx + 1}`}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = companyForm.termsAndConditions.filter((_, i) => i !== idx);
                                  setCompanyForm({ ...companyForm, termsAndConditions: updated });
                                }}
                                className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={companyForm.termsAndConditions.length >= config.company.maxTerms}
                            onClick={() => setCompanyForm({
                              ...companyForm,
                              termsAndConditions: [...companyForm.termsAndConditions, ""],
                            })}
                            className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4" />
                            Add Term
                          </button>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={companyLoading}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {companyLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4" />
                              Update Company
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Manage Users Tab */}
            {activeTab === "users" && currentUser?.role === config.roles.COMPANY_ADMIN && (
              <div className="space-y-5">

                {/* Users List */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          Manage Users
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          All users in your company
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300">
                        {users.length} user{users.length !== 1 ? "s" : ""}
                      </span>
                      <button
                        onClick={() => setShowCreateUserModal(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Add User
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">User</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">Role</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">Created</th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                  user.role === config.roles.COMPANY_ADMIN
                                    ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                    : "bg-gradient-to-br from-blue-500 to-blue-600"
                                }`}>
                                  {user.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                                    {user.username}
                                    {user._id === currentUser._id && (
                                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full whitespace-nowrap">
                                        You
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                                    {user._id.slice(-6)}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                user.role === config.roles.COMPANY_ADMIN
                                  ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                  : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                              }`}>
                                {user.role === config.roles.COMPANY_ADMIN && <Shield className="w-3 h-3" />}
                                {user.role === config.roles.COMPANY_ADMIN ? "Admin" : "User"}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-xs text-gray-700 dark:text-gray-300">
                              {formatISTDateTime(user.createdAt)}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                {user._id !== currentUser._id ? (
                                  <>
                                    <button
                                      onClick={() => setEditingUser(user)}
                                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                                      title="Edit User"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(user)}
                                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                                      title="Delete User"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                                    Current User
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users.length === 0 && (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                        No users yet
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Click "Add User" above to create your first user
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto z-50">
          <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">Create New User</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Standard user role · your company</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCreateUserModal(false);
                  setNewUserForm({ username: "", password: "", role: config.roles.COMPANY_USER });
                }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Form section */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword.newUser ? "text" : "password"}
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    placeholder="Min. 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility("newUser")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword.newUser ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Password must be at least 6 characters</p>
              </div>
            </div>

            {/* Permissions Table */}
            <div className="mx-5 mb-5 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white">Role Permissions</span>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">This user will be created as a Standard User</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50">
                    <tr>
                      <th className="py-2.5 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400">Permission</th>
                      <th className="py-2.5 px-4 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1"><Shield className="w-3 h-3" />Admin</span>
                      </th>
                      <th className="py-2.5 px-4 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1"><User className="w-3 h-3" />User</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                    {[
                      { label: "Create invoices",             admin: true,  user: true  },
                      { label: "View own invoices",           admin: true,  user: true  },
                      { label: "Edit own invoices",           admin: true,  user: true  },
                      { label: "View all company invoices",   admin: true,  user: false },
                      { label: "Edit any invoice",            admin: true,  user: false },
                      { label: "Delete & restore invoices",   admin: true,  user: false },
                      { label: "Access invoice trash",        admin: true,  user: false },
                      { label: "Manage users",                admin: true,  user: false },
                      { label: "Edit company details",        admin: true,  user: false },
                      { label: "See invoice creator name",    admin: true,  user: false },
                    ].map((row) => (
                      <tr key={row.label} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-2 px-4 text-xs text-gray-700 dark:text-gray-300">{row.label}</td>
                        <td className="py-2 px-4 text-center">
                          {row.admin
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                        <td className="py-2 px-4 text-center">
                          {row.user
                            ? <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            : <X className="w-4 h-4 text-red-400 mx-auto" />}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={handleCreateUser}
                className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-xl shadow-sm hover:shadow transition-all"
              >
                <UserPlus className="w-4 h-4 flex-shrink-0" />
                I understand the roles — Create User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateUserModal(false);
                  setNewUserForm({ username: "", password: "", role: config.roles.COMPANY_USER });
                }}
                className="sm:w-auto px-5 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onSave={(updated) => {
            setUsers((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
            setEditingUser(null);
            setMessage({ type: "success", text: "User updated successfully!" });
          }}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Delete User Modal */}
      {deleteTarget && (
        <DeleteUserModal
          user={deleteTarget}
          onConfirm={confirmDeleteUser}
          onClose={() => { if (!deleting) setDeleteTarget(null); }}
          deleting={deleting}
        />
      )}
    </div>
  );
}
