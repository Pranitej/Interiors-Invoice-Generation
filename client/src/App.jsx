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

function App() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("theme");
    return storedTheme ? storedTheme : "light";
  });

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
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
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      <div
        className={`${theme} min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-gray-100`}
      >
        <BrowserRouter>
          <Header theme={theme} toggleTheme={toggleTheme} />
          <main className="max-w-6xl mx-auto p-4">
            <Routes>
              <Route path="/" element={<Login />} />
              {user && (
                <>
                  <Route path="/new-quote/:id" element={<NewQuote />} />
                  <Route path="/new-quote" element={<NewQuote />} />
                  <Route path="/history" element={<History />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/profile" element={<Profile />} />
                </>
              )}
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </main>
        </BrowserRouter>
      </div>
    </AuthContext.Provider>
  );
}

export default App;
