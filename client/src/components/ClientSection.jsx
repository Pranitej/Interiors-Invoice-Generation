export default function ClientSection({
  client,
  setClient,
  useCurrentLocation,
  setUseCurrentLocation,
  onClearDraft,
  canClearDraft,
}) {
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setClient((p) => ({ ...p, siteMapLink: link }));
        setUseCurrentLocation(true);
      },
      () => alert("Failed to fetch location")
    );
  };

  const handleRemoveLocation = () => {
    setClient((p) => ({ ...p, siteMapLink: "" }));
    setUseCurrentLocation(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar with Clear Draft */}
      <div className="flex justify-end">
        {canClearDraft && onClearDraft && (
          <button
            onClick={onClearDraft}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-xs font-medium border border-red-200 dark:border-red-800"
          >
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
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Clear Draft
          </button>
        )}
      </div>

      {/* Client Information Grid */}
      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Client Name
            </label>
            <input
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter client name"
              value={client.name}
              onChange={(e) => setClient({ ...client, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Mobile Number
            </label>
            <input
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              placeholder="Enter mobile number"
              value={client.mobile}
              onChange={(e) => setClient({ ...client, mobile: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Email Address
          </label>
          <input
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter email address"
            value={client.email}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Site Address <span className="text-red-500">*</span>
          </label>
          <input
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            placeholder="Enter complete site address"
            value={client.siteAddress}
            onChange={(e) =>
              setClient({ ...client, siteAddress: e.target.value })
            }
          />
        </div>
      </div>

      {/* Location Section */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
              Location Information
            </h4>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  client.siteMapLink
                    ? "bg-green-500 animate-pulse"
                    : "bg-gray-400"
                }`}
              ></div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {client.siteMapLink ? "Location set" : "No location"}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            Capture current location for accurate site mapping
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 relative">
              <input
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white pr-9"
                placeholder="Google Maps link will appear here"
                value={client.siteMapLink}
                readOnly
              />
              {client.siteMapLink && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleGetLocation}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium min-w-[140px]"
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
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Use Location
              </button>

              {client.siteMapLink && (
                <button
                  onClick={handleRemoveLocation}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear
                </button>
              )}
            </div>
          </div>

          {useCurrentLocation && client.siteMapLink && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/30">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Location captured
                </span>
              </div>
              <a
                href={client.siteMapLink}
                target="_blank"
                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm font-medium transition-colors"
                rel="noreferrer"
              >
                Preview on Maps
                <svg
                  className="w-4 h-4 ml-1.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Site address is required for saving invoice. Location helps in
          accurate site mapping.
        </p>
      </div>
    </div>
  );
}
