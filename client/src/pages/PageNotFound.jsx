import { useNavigate } from "react-router-dom";

export default function PageNotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* 404 Illustration */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-48 h-48 mb-6">
            {/* Outer circle */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 animate-pulse"></div>

            {/* Middle circle */}
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-800/10 animate-pulse delay-300"></div>

            {/* Inner circle */}
            <div className="absolute inset-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 animate-pulse delay-600"></div>

            {/* 404 Text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-6xl font-black bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                404
              </div>
            </div>
          </div>

          <div className="w-24 h-2 mx-auto bg-gradient-to-r from-blue-500 via-red-500 to-amber-500 rounded-full mb-6"></div>
        </div>

        {/* Content Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {/* Card Header */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white text-center">
              Page Not Found
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mt-2">
              Oops! The page you're looking for doesn't exist.
            </p>
          </div>

          {/* Card Body */}
          <div className="px-8 py-8">
            <div className="space-y-6">
              {/* Error Message */}
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800/30 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-5 h-5 text-blue-600 dark:text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                      What happened?
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                      The page may have been moved, deleted, or you might have
                      entered an incorrect URL.
                    </p>
                  </div>
                </div>
              </div>

              {/* Suggested Actions */}
              <div>
                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                  Here are some helpful links:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/")}
                    className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-800/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Go to Dashboard</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Return to homepage
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate("/history")}
                    className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-800/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-4 h-4 text-green-600 dark:text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">View History</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Check your invoices
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate("/new-quote")}
                    className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-purple-800/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-4 h-4 text-purple-600 dark:text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">New Quote</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Create a new invoice
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => window.history.back()}
                    className="group flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-amber-800/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg
                        className="w-4 h-4 text-amber-600 dark:text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium">Go Back</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Return to previous page
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="pt-4">
                <button
                  onClick={() => navigate("/")}
                  className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl font-bold text-lg group"
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Go to Homepage
                </button>
              </div>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-8 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Still having trouble?{" "}
                <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium">
                  Contact Support
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 flex justify-center space-x-4">
          <div className="w-3 h-3 rounded-full bg-blue-500 animate-bounce"></div>
          <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce delay-150"></div>
          <div className="w-3 h-3 rounded-full bg-amber-500 animate-bounce delay-300"></div>
        </div>

        {/* Tech Details */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-full border border-gray-200 dark:border-gray-700">
            <svg
              className="w-3 h-3 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
              Error 404 • Page Not Found
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
