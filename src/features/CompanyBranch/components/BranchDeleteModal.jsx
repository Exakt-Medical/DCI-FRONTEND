import { Button } from "../../../components/Button";
import { AlertTriangle, X } from "lucide-react";

export const BranchDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  branchName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold text-gray-900">Confirm Delete</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-700">
            Are you sure you want to delete branch <strong>{branchName}</strong>
            ?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="danger">
            Delete Branch
          </Button>
        </div>
      </div>
    </div>
  );
};
