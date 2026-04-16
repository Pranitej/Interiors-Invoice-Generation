// client/src/components/DeleteUserModal.jsx
import { useEffect } from "react";
import { Trash2 } from "lucide-react";

export default function DeleteUserModal({ user, onConfirm, onClose, deleting }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-user-title"
        className="bg-white dark:bg-gray-800 rounded-lg p-5 max-w-sm w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
            <Trash2 className="text-red-600 dark:text-red-400" size={20} />
          </div>
          <h3
            id="delete-user-title"
            className="text-base font-semibold text-gray-900 dark:text-white mb-2"
          >
            Delete &quot;{user.username}&quot;?
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            This will permanently delete the user. If they have created
            invoices, their account will be retained to preserve invoice
            history.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onConfirm(user._id)}
              disabled={deleting}
              className="flex-1 px-3 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {deleting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={14} />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
