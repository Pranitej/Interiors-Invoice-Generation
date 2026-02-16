import { Link, useNavigate } from "react-router-dom";
import { useContext, useState, useRef, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { History, Plus, Scale, User, UserStar } from "lucide-react";

export default function Header({ theme, toggleTheme }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Dynamic navigation configuration
  const navigationLinks = [
    {
      path: "/new-quote",
      label: "New Quote",
      icon: <Plus />,
      colorClass:
        "from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20",
      iconColor: "text-green-600 dark:text-green-400",
      description: "Create new estimate",
      showForAdmin: true,
      showForUser: true,
    },
    {
      path: "/history",
      label: "History",
      icon: <History />,
      colorClass:
        "from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20",
      iconColor: "text-amber-600 dark:text-amber-400",
      description: "View past quotes",
      showForAdmin: true,
      showForUser: true,
    },
    {
      path: "/compare",
      label: "Compare",
      icon: <Scale />,
      colorClass:
        "from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      description: "Compare multiple quotes",
      showForAdmin: true,
      showForUser: true,
    },
  ];

  // Filter navigation links based on user role
  const getFilteredLinks = () => {
    if (!user) return [];
    return navigationLinks.filter((link) =>
      user.isAdmin ? link.showForAdmin : link.showForUser,
    );
  };

  const handleLogout = () => {
    logout();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when clicking on a link
  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const filteredLinks = getFilteredLinks();

  const handleProfileClick = () => {
    navigate("/profile");
  };

  return (
    <header className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo/Brand */}
          <div className="flex items-center">
            <Link
              to="/"
              className="flex items-center gap-2 group"
              onClick={handleMobileLinkClick}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-400 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-base">S</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Skanda Industries
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                  Professional Quoting
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Desktop Navigation */}
          {user && filteredLinks.length > 0 && (
            <nav className="hidden md:flex items-center space-x-2">
              {filteredLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 flex items-center gap-2 group ${
                    link.path === "/admin"
                      ? "hover:text-purple-600 dark:hover:text-purple-400"
                      : ""
                  }`}
                >
                  <div className="group-hover:scale-100 scale-90 transition-transform">
                    {link.icon}
                  </div>
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Right: User controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User info - Desktop */}
            {user && (
              <div className="hidden md:flex items-center gap-3 mr-2">
                <div className="flex flex-col items-end">
                  <span className="text-sm font-medium text-gray-800 dark:text-white">
                    {user.username}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {user.isAdmin ? "Administrator" : "User"}
                  </span>
                </div>
                <div
                  className="relative cursor-pointer"
                  onClick={handleProfileClick}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-medium shadow-md ring-2 ring-white dark:ring-gray-800">
                    {user.isAdmin ? <UserStar /> : <User />}
                  </div>
                  {user.isAdmin && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs shadow-sm">
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="relative p-2.5 rounded-xl bg-gradient-to-b from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 shadow-sm hover:shadow group"
              title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
              aria-label={`Switch to ${
                theme === "light" ? "dark" : "light"
              } theme`}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                {/* Sun icon for light mode */}
                <svg
                  className={`w-5 h-5 text-amber-500 transition-all duration-500 ${
                    theme === "light"
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 rotate-90 opacity-0"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                    clipRule="evenodd"
                  />
                </svg>

                {/* Moon icon for dark mode */}
                <svg
                  className={`absolute top-0 left-0 w-5 h-5 text-blue-400 transition-all duration-500 ${
                    theme === "dark"
                      ? "scale-100 rotate-0 opacity-100"
                      : "scale-0 -rotate-90 opacity-0"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
            </button>

            {/* Mobile menu button */}
            {user && (
              <div className="relative md:hidden" ref={mobileMenuRef}>
                <button
                  onClick={handleMobileMenuToggle}
                  className={`p-2.5 rounded-xl border transition-all duration-300 ${
                    isMobileMenuOpen
                      ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                  aria-label="Menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <div className="relative w-5 h-5">
                    <span
                      className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isMobileMenuOpen
                          ? "rotate-45 top-1/2"
                          : "-translate-y-2"
                      }`}
                    ></span>
                    <span
                      className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isMobileMenuOpen ? "opacity-0" : "opacity-100"
                      }`}
                    ></span>
                    <span
                      className={`absolute top-1/2 left-1/2 w-5 h-0.5 bg-gray-600 dark:bg-gray-300 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                        isMobileMenuOpen
                          ? "-rotate-45 top-1/2"
                          : "translate-y-2"
                      }`}
                    ></span>
                  </div>
                </button>

                {/* Mobile dropdown menu */}
                <div
                  className={`absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 transition-all duration-300 transform ${
                    isMobileMenuOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {/* User info in mobile menu */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => navigate("/profile")}
                        className="w-10 cursor-pointer h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-base font-medium shadow-sm"
                      >
                        {user.isAdmin ? <UserStar /> : <User />}
                      </div>
                      <div
                        className="cursor-pointer"
                        onClick={() => navigate("/profile")}
                      >
                        <div className="font-medium text-gray-800 dark:text-white">
                          {user.username}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          {user.isAdmin ? "Administrator" : "User"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile navigation links */}
                  <div className="py-2 max-h-96 overflow-y-auto">
                    {filteredLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={handleMobileLinkClick}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${link.colorClass} flex items-center justify-center`}
                        >
                          <div className={link.iconColor}>{link.icon}</div>
                        </div>
                        <div>
                          <div className="font-medium">{link.label}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {link.description}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Logout button in mobile menu */}
                  <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-300 shadow-sm hover:shadow"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop logout button */}
            {user && (
              <button
                onClick={handleLogout}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] group"
              >
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
