import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import Login from "./pages/Login";
import NewQuote from "./pages/NewQuote";
import History from "./pages/History";
import Compare from "./pages/Compare";
import Header from "./components/Header";
import Profile from "./pages/Profile";
import { AuthContext } from "./context/AuthContext";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import Companies from "./pages/Companies";
import CompanyDetail from "./pages/CompanyDetail";

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light";
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [company, setCompany] = useState(() => {
    const stored = localStorage.getItem("company");
    return stored ? JSON.parse(stored) : null;
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("theme", next);
      document.documentElement.classList.toggle("dark", next === "dark");
      return next;
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCompany(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("company");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, setToken, company, setCompany, logout }}>
      <div
        className={`${theme} min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100`}
      >
        <BrowserRouter>
          <Header theme={theme} toggleTheme={toggleTheme} />
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
                path="/companies"
                element={
                  <ProtectedRoute roles={["super_admin"]}>
                    <Companies />
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
