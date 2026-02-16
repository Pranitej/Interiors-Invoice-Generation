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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatISTDateTime } from "../utils/dateTime";

export default function Profile() {
  const { user: currentUser, setUser: setCurrentUser } =
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
    isAdmin: false,
  });
  const [editingUser, setEditingUser] = useState(null);
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
    if (currentUser.isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [currentUser, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setMessage({ type: "error", text: "Failed to load users" });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    // Validate passwords if changing
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
        ...(profileForm.currentPassword && {
          currentPassword: profileForm.currentPassword,
          newPassword: profileForm.newPassword,
        }),
      };

      const response = await api.put(`/auth/users/${currentUser._id}`, payload);

      // Update context
      setCurrentUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));

      setMessage({
        type: "success",
        text: "Profile updated successfully!",
      });

      // Clear password fields
      setProfileForm({
        ...profileForm,
        currentPassword: "",
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
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (newUserForm.password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters",
      });
      return;
    }

    try {
      const response = await api.post("/auth/users", newUserForm);

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

      setNewUserForm({
        username: "",
        password: "",
        isAdmin: false,
      });

      fetchUsers();
    } catch (error) {
      console.error("Create user failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create user",
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (editingUser._id === currentUser._id && !editingUser.isAdmin) {
      setMessage({
        type: "error",
        text: "You cannot revoke your own admin rights",
      });
      return;
    }

    try {
      const payload = {
        username: editingUser.username,
        isAdmin: editingUser.isAdmin,
        ...(editingUser.password && { password: editingUser.password }),
      };

      await api.put(`/auth/users/${editingUser._id}`, payload);

      setMessage({
        type: "success",
        text: "User updated successfully!",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Update user failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update user",
      });
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser._id) {
      setMessage({ type: "error", text: "Cannot delete your own account" });
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      await api.delete(`/auth/users/${userId}`);

      setMessage({
        type: "success",
        text: "User deleted successfully!",
      });

      fetchUsers();
    } catch (error) {
      console.error("Delete user failed:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete user",
      });
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
    ...(currentUser?.isAdmin
      ? [
          { id: "users", label: "Manage Users", icon: Users, color: "purple" },
          {
            id: "create-user",
            label: "Create User",
            icon: UserPlus,
            color: "green",
          },
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
                      {currentUser?.isAdmin ? (
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
            )}

            {/* Manage Users Tab */}
            {activeTab === "users" && currentUser?.isAdmin && (
              <div className="space-y-5">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                          User Management
                        </h2>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Manage all system users and permissions
                        </p>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {users.length} user{users.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-900/50">
                        <tr>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">
                            User
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">
                            Role
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">
                            Created
                          </th>
                          <th className="py-3 px-4 text-left text-xs font-semibold text-gray-900 dark:text-white">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {users.map((user) => (
                          <tr
                            key={user._id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                                    user.isAdmin
                                      ? "bg-gradient-to-br from-purple-500 to-purple-600"
                                      : "bg-gradient-to-br from-blue-500 to-blue-600"
                                  }`}
                                >
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
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                                  user.isAdmin
                                    ? "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                                    : "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                                }`}
                              >
                                {user.isAdmin && <Shield className="w-3 h-3" />}
                                {user.isAdmin ? "Admin" : "User"}
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
                                      onClick={() => handleDeleteUser(user._id)}
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
                        No users found
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Create your first user to get started
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Create User Tab */}
            {activeTab === "create-user" && currentUser?.isAdmin && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                      <UserPlus className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        Create New User
                      </h2>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Add a new user to the system
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleCreateUser} className="p-5">
                  <div className="space-y-5 max-w-2xl m-auto">
                    {/* Username */}
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
                          value={newUserForm.username}
                          onChange={(e) =>
                            setNewUserForm({
                              ...newUserForm,
                              username: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter username"
                          required
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword.newUser ? "text" : "password"}
                          value={newUserForm.password}
                          onChange={(e) =>
                            setNewUserForm({
                              ...newUserForm,
                              password: e.target.value,
                            })
                          }
                          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                          placeholder="Enter password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility("newUser")}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showPassword.newUser ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    {/* Role Selection */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        User Role
                      </label>
                      <div className="grid md:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setNewUserForm({ ...newUserForm, isAdmin: false })
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            !newUserForm.isAdmin
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                !newUserForm.isAdmin
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {!newUserForm.isAdmin && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" />
                                Standard User
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Can create and view quotes
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setNewUserForm({ ...newUserForm, isAdmin: true })
                          }
                          className={`p-3 rounded-lg border transition-all ${
                            newUserForm.isAdmin
                              ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                                newUserForm.isAdmin
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-gray-300 dark:border-gray-600"
                              }`}
                            >
                              {newUserForm.isAdmin && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                              )}
                            </div>
                            <div className="text-left">
                              <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" />
                                Administrator
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                Full system access
                              </div>
                            </div>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
                      <button
                        type="submit"
                        className="flex-1 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("users")}
                        className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit User
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser}>
              <div className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.username}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        username: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    New Password
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-normal ml-1">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="password"
                    value={editingUser.password || ""}
                    onChange={(e) =>
                      setEditingUser({
                        ...editingUser,
                        password: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave blank to keep current"
                  />
                </div>

                {/* Role */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={editingUser.isAdmin}
                        onChange={(e) =>
                          setEditingUser({
                            ...editingUser,
                            isAdmin: e.target.checked,
                          })
                        }
                        className="sr-only"
                      />
                      <div
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                          editingUser.isAdmin
                            ? "border-purple-500 bg-purple-500"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {editingUser.isAdmin && (
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                        Administrator
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 mt-6">
                <button
                  type="submit"
                  className="flex-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
