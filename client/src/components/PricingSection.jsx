import { formatINR, roundTo2 } from "../utils/calculations";
import ROOM_CONFIG from "../json/roomConfig.json";

export default function PricingSection({
  globalFrameRate,
  globalBoxRate,
  onChangeFrameRate,
  onChangeBoxRate,
  discount,
  invoiceType,
  setInvoiceType,
  setDiscount,
}) {
  const calculatedBoxRate = roundTo2(globalFrameRate * 1.4);
  const isUsingDefault = Math.abs(globalBoxRate - calculatedBoxRate) < 0.01;
  const multiplier =
    globalFrameRate > 0 ? (globalBoxRate / globalFrameRate).toFixed(2) : "0.00";

  const invoiceTypes = Array.isArray(ROOM_CONFIG.invoiceTypes)
    ? ROOM_CONFIG.invoiceTypes
    : [];

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white">
            Pricing Rates
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Set global rates for frame and box calculations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
            Multiplier: {multiplier}×
          </div>
        </div>
      </div>

      {/* Rate Inputs - Side by Side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Frame Rate Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Frame Rate
            </label>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
              {formatINR(globalFrameRate)}/sqft
            </span>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₹
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter frame rate"
              value={globalFrameRate}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                onChangeFrameRate(value);
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
              /sqft
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Framework rate per square foot
          </div>
        </div>

        {/* Box Rate Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Box Rate
            </label>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-medium ${
                  isUsingDefault
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {formatINR(globalBoxRate)}/sqft
              </span>
              <span
                className={`px-1.5 py-0.5 rounded text-xs ${
                  isUsingDefault
                    ? "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                    : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {isUsingDefault ? "Auto" : "Custom"}
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
              ₹
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              className={`w-full pl-9 pr-4 py-2.5 bg-white dark:bg-gray-700 border rounded-lg focus:ring-1 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                isUsingDefault
                  ? "border-gray-300 dark:border-gray-600 focus:ring-green-500"
                  : "border-amber-300 dark:border-amber-600 focus:ring-amber-500"
              }`}
              placeholder="Enter box rate"
              value={globalBoxRate}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                onChangeBoxRate(value);
              }}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400">
              /sqft
            </div>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isUsingDefault ? (
              <>Automatically set to 1.4× frame rate</>
            ) : (
              <>Custom box rate applied</>
            )}
          </div>
        </div>
      </div>

      {/* Rate Comparison Bar */}
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Rate Comparison
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Box/Frame:{" "}
            {globalFrameRate > 0
              ? (globalBoxRate / globalFrameRate).toFixed(2)
              : "0.00"}
            ×
          </span>
        </div>

        <div className="flex items-center h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 flex items-center justify-end pr-2"
            style={{
              width: `${
                globalFrameRate > 0
                  ? Math.min(
                      (globalFrameRate / (globalFrameRate + globalBoxRate)) *
                        100,
                      100,
                    )
                  : 50
              }%`,
            }}
          >
            <span className="text-xs font-medium text-white">Frame</span>
          </div>
          <div
            className="h-full bg-green-500 transition-all duration-300 flex items-center pl-2"
            style={{
              width: `${
                globalBoxRate > 0
                  ? Math.min(
                      (globalBoxRate / (globalFrameRate + globalBoxRate)) * 100,
                      100,
                    )
                  : 50
              }%`,
            }}
          >
            <span className="text-xs font-medium text-white">Box</span>
          </div>
        </div>

        <div className="flex justify-between mt-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Frame: {formatINR(globalFrameRate)}
          </div>
          <div
            className={`text-xs ${
              isUsingDefault
                ? "text-green-600 dark:text-green-400"
                : "text-amber-600 dark:text-amber-400"
            }`}
          >
            Box: {formatINR(globalBoxRate)}
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/20 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0"
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
          <div className="space-y-1">
            <p className="text-xs text-gray-700 dark:text-gray-300">
              Changing the frame rate automatically updates the box rate to 1.4×
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                Frame: ₹{globalFrameRate}
              </span>
              <span className="text-gray-500">×</span>
              <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                1.4
              </span>
              <span className="text-gray-500">=</span>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                Box: ₹{calculatedBoxRate.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Section */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <svg
                className="w-4 h-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
              Invoice & Discount
            </h3>
            {discount > 0 && (
              <span className="text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                - {formatINR(discount)}
              </span>
            )}
          </div>

          {/* Invoice Type & Discount Side by Side */}
          <div className="grid grid-cols-2 gap-3">
            {/* Invoice Type Card */}
            <div className="relative group">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-0.5">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Invoice Type
                </div>
              </label>
              <div className="relative">
                <select
                  value={invoiceType || ""}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all text-gray-900 dark:text-white text-sm appearance-none cursor-pointer"
                >
                  <option value="">Select type</option>
                  {invoiceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg
                    className="w-4 h-4 text-gray-500 dark:text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
              {invoiceType && (
                <div className="absolute -top-1 right-2">
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                    Selected
                  </span>
                </div>
              )}
            </div>

            {/* Discount Card */}
            <div className="relative group">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-0.5">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3.5 h-3.5 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Discount Amount
                </div>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => {
                    const value = Number(e.target.value) || 0;
                    setDiscount(value);
                  }}
                />
                {discount > 0 && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <button
                      type="button"
                      onClick={() => setDiscount(0)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                      title="Clear discount"
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
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center justify-between">
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
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Flat discount
                </div>
                {discount > 0 && (
                  <div className="text-xs font-medium text-red-600 dark:text-red-400">
                    {formatINR(discount)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-2">
              <svg
                className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <span className="font-medium">Invoice Type:</span> Determines
                the pricing and quality.
                <span className="block mt-0.5">
                  <span className="font-medium">Discount:</span> Flat amount
                  deducted from the grand total.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rate Summary */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            Pricing Summary
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Frame Rate Card */}
          <div className="relative p-3 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800/30">
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2">
              <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded-full">
                Frame
              </span>
            </div>
            <div className="text-center pt-1.5">
              <div className="text-xs text-blue-600 dark:text-blue-400 mb-1 font-medium">
                Frame Rate
              </div>
              <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                ₹{globalFrameRate}
              </div>
              <div className="text-xs text-blue-500/70 dark:text-blue-400/60 mt-0.5">
                per frame
              </div>
            </div>
          </div>

          {/* Box Rate Card */}
          <div
            className={`relative p-3 rounded-lg border ${
              isUsingDefault
                ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/10 border-green-100 dark:border-green-800/30"
                : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 border-amber-100 dark:border-amber-800/30"
            }`}
          >
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2">
              <span
                className={`px-1.5 py-0.5 text-xs font-medium rounded-full ${
                  isUsingDefault
                    ? "bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300"
                    : "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300"
                }`}
              >
                Box
              </span>
            </div>
            <div className="text-center pt-1.5">
              <div className="text-xs mb-1 font-medium flex items-center justify-center gap-1">
                <span
                  className={
                    isUsingDefault
                      ? "text-green-600 dark:text-green-400"
                      : "text-amber-600 dark:text-amber-400"
                  }
                >
                  Box Rate
                </span>
                {!isUsingDefault && (
                  <span className="text-amber-600 dark:text-amber-400">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </div>
              <div
                className={`text-lg font-bold ${
                  isUsingDefault
                    ? "text-green-700 dark:text-green-300"
                    : "text-amber-700 dark:text-amber-300"
                }`}
              >
                ₹{globalBoxRate}
              </div>
              <div
                className={`text-xs mt-0.5 ${
                  isUsingDefault
                    ? "text-green-500/70 dark:text-green-400/60"
                    : "text-amber-500/70 dark:text-amber-400/60"
                }`}
              >
                per box
              </div>
            </div>
          </div>
        </div>

        {/* Discount Summary Card - Compact version */}
        {discount > 0 && (
          <div className="mt-2 p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/10 rounded-lg border border-red-100 dark:border-red-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-100 dark:bg-red-800 rounded-md">
                  <svg
                    className="w-3.5 h-3.5 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Discount Applied
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-red-600 dark:text-red-400">
                  - {formatINR(discount)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
