import { useState } from "react";
import { Modal } from "../../../components/Modal";
import { Button } from "../../../components/Button";
import { AlertTriangle } from "lucide-react";

export const MvcMecMismatchModal = ({ mismatches, isOpen, onClose, onSubmit }) => {
  const [selections, setSelections] = useState({});

  if (!isOpen) return null;

  const handleSelect = (field, source) => {
    setSelections((prev) => ({ ...prev, [field]: source }));
  };

  const isAllSelected = mismatches.every((m) => selections[m.field]);

  const handleSubmit = () => {
    if (!isAllSelected) return;
    const resolvedValues = {};
    mismatches.forEach((m) => {
      resolvedValues[m.field] = selections[m.field] === "MVCC" ? m.mvccValue : m.mecValue;
    });
    onSubmit(resolvedValues);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Data Mismatch Detected">
      <div className="p-4 space-y-4">
        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-amber-800 font-bold text-sm">Review Extracted Data</h4>
            <p className="text-amber-700 text-xs mt-1 leading-relaxed">
              We noticed differences between the data extracted from your MVCC and MEC.
              Please select the correct value for each field to proceed.
            </p>
          </div>
        </div>

        <div className="space-y-4 mt-4">
          {mismatches.map((m) => (
            <div key={m.field} className="border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 text-sm mb-3 uppercase tracking-wider">{m.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => handleSelect(m.field, "MVCC")}
                  className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-colors ${
                    selections[m.field] === "MVCC"
                      ? "border-[#0059b5] bg-[#f8fbff]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">From MVCC</p>
                  <p className="font-semibold text-gray-900 truncate" title={m.mvccValue || "N/A"}>
                    {m.mvccValue || <span className="text-gray-400 italic">Empty</span>}
                  </p>
                </div>
                <div
                  onClick={() => handleSelect(m.field, "MEC")}
                  className={`cursor-pointer rounded-lg border-2 p-3 text-center transition-colors ${
                    selections[m.field] === "MEC"
                      ? "border-[#0059b5] bg-[#f8fbff]"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">From MEC</p>
                  <p className="font-semibold text-gray-900 truncate" title={m.mecValue || "N/A"}>
                    {m.mecValue || <span className="text-gray-400 italic">Empty</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isAllSelected}>
            Confirm Selection
          </Button>
        </div>
      </div>
    </Modal>
  );
};
