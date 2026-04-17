// client/src/components/SubscriptionBanner.jsx
// Shows contextual alerts based on subscription state and download-block status.
// Rules:
//   - Inactive (any reason):  cannot create/edit — show inactive remark if present.
//   - downloadsBlocked:       cannot download — shown regardless of active status.
//   - subscriptionState=warning: expiry countdown (can still do everything).
//   Expired subscription itself is handled by the cron deactivating the company,
//   so no separate "expired" state needed here — it shows as inactive.
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { AlertTriangle, Ban, Download } from "lucide-react";

export default function SubscriptionBanner() {
  const { subscriptionStatus, user } = useContext(AuthContext);

  if (!user || user.role === "super_admin") return null;
  if (!subscriptionStatus) return null;

  const {
    isActive,
    downloadsBlocked,
    subscriptionState,
    daysUntilExpiry,
    subscriptionAmount,
    platformAmount,
    inactiveRemarks,
  } = subscriptionStatus;

  const isAdmin = user.role === "company_admin";
  const displayAmount = isAdmin ? (subscriptionAmount ?? platformAmount) : null;
  const banners = [];

  // 1. Inactive company
  if (!isActive) {
    banners.push(
      <div key="inactive" className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-start gap-3">
          <Ban className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-300">
            <span className="font-semibold">Account suspended — </span>
            {inactiveRemarks
              ? inactiveRemarks
              : "Your account is inactive. Please contact support to renew your subscription."}
            {displayAmount ? (
              <span className="ml-1 font-medium">
                Renewal amount: ₹{Number(displayAmount).toLocaleString("en-IN")}.
              </span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  // 2. Downloads explicitly blocked by admin
  if (downloadsBlocked) {
    banners.push(
      <div key="downloads" className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-800">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <Download className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            <span className="font-semibold">Invoice downloads are disabled</span> for your account.
            Please contact your administrator for assistance.
          </p>
        </div>
      </div>
    );
  }

  // 3. Subscription expiry warning (active company, subscription expiring soon)
  if (isActive && subscriptionState === "warning" && daysUntilExpiry !== null) {
    banners.push(
      <div key="warning" className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <span className="font-semibold">Subscription expiring in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? "s" : ""}!</span>{" "}
            Please renew before it expires to avoid service interruption.
            {displayAmount ? (
              <span className="ml-1">
                Renewal amount: <span className="font-semibold">₹{Number(displayAmount).toLocaleString("en-IN")}</span>.
              </span>
            ) : null}
          </p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;
  return <>{banners}</>;
}
