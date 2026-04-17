import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import Login from "./pages/Login";
import NewQuote from "./pages/NewQuote";
import History from "./pages/History";
import Compare from "./pages/Compare";
import Header from "./components/Header";
import SubscriptionBanner from "./components/SubscriptionBanner";
import Profile from "./pages/Profile";
import { AuthContext } from "./context/AuthContext";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CompanyDetail from "./pages/CompanyDetail";
import API from "./api/api";

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light";
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem("company");
    return stored ? JSON.parse(stored) : null;
  });

  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const lastSubscriptionHash = useRef(null);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  const logout = async () => {
    try { await API.post("/auth/logout"); } catch { /* best-effort */ }
    setUser(null);
    setCompany(null);
    setSubscriptionStatus(null);
    localStorage.removeItem("user");
    localStorage.removeItem("company");
  };

  const fetchSubscriptionStatus = useCallback(async () => {
    if (!user || user.role === "super_admin") return;
    try {
      const res = await API.get("/subscription/status");
      const newHash = JSON.stringify(res.data.data);
      if (newHash !== lastSubscriptionHash.current) {
        lastSubscriptionHash.current = newHash;
        setSubscriptionStatus(res.data.data);
      }
    } catch {
      // non-critical
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptionStatus();
    // Refresh subscription status every 5 minutes while logged in
    if (!user || user.role === "super_admin") return;
    const interval = setInterval(fetchSubscriptionStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchSubscriptionStatus, user]);

  return (
    <AuthContext.Provider value={{ user, setUser, company, setCompany, subscriptionStatus, setSubscriptionStatus, logout }}>
      <div
        className={`${theme} min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100`}
      >
        <BrowserRouter>
          <Header theme={theme} toggleTheme={toggleTheme} />
          <SubscriptionBanner />
          <main className="max-w-6xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<Login />} />

              {/* Super admin routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["super_admin"]}>
                    <SuperAdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/companies/:id"
                element={
                  <ProtectedRoute roles={["super_admin"]}>
                    <CompanyDetail />
                  </ProtectedRoute>
                }
              />

              {/* Company user/admin routes */}
              <Route
                path="/new-quote/:id"
                element={
                  <ProtectedRoute roles={["company_user", "company_admin"]}>
                    <NewQuote />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/new-quote"
                element={
                  <ProtectedRoute roles={["company_user", "company_admin"]}>
                    <NewQuote />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute roles={["company_user", "company_admin"]}>
                    <History />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/compare"
                element={
                  <ProtectedRoute roles={["company_user", "company_admin"]}>
                    <Compare />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
