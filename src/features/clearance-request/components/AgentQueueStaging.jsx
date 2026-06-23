import React from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { getMissingFieldsText, isDocumentComplete, OR_EXPECTED_FIELDS, CR_EXPECTED_FIELDS } from "../utils/clearanceHelpers";
import { OCR_STATUS } from "../../../hooks/useOcrForm";

export const AgentQueueStaging = ({
  orCr,
  crCr,
  orNumber,
  crNumber,
  hasMismatch,
  ocrUploadState,
  handleAddToQueue,
  certificationQueue,
}) => {
  return (
    <Card className="mt-4 p-4 border border-blue-100 bg-blue-50/40">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Bulk Queue Staging
          </p>
          <p className="text-xs text-gray-600">
            Upload OR/CR then add each transaction to queue.
          </p>
          {(ocrUploadState?.or?.status !== OCR_STATUS.IDLE || ocrUploadState?.cr?.status !== OCR_STATUS.IDLE) && 
           (!isDocumentComplete(orCr, OR_EXPECTED_FIELDS) || !orNumber || !isDocumentComplete(crCr, CR_EXPECTED_FIELDS) || !crNumber || hasMismatch) && (
            <div className="mt-2 text-[11px] text-red-600 space-y-0.5 font-medium">
              {(!orNumber || orNumber === "Extracting...") && <p>• Missing OR Number</p>}
              {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(orCr, "OR", OR_EXPECTED_FIELDS)}</p>}
              {(!crNumber || crNumber === "Extracting...") && <p>• Missing CR Number</p>}
              {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS) && <p>• {getMissingFieldsText(crCr, "CR", CR_EXPECTED_FIELDS)}</p>}
            </div>
          )}
        </div>
        <Button
          onClick={handleAddToQueue}
          disabled={
            !isDocumentComplete(orCr, OR_EXPECTED_FIELDS) || !orNumber || !isDocumentComplete(crCr, CR_EXPECTED_FIELDS) || !crNumber || hasMismatch
          }
        >
          Add To Queue
        </Button>
      </div>

      {certificationQueue.length === 0 ? (
        <p className="text-sm text-gray-500">
          No staged entries yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blue-100 text-left">
                <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Request ID
                </th>
                <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Plate
                </th>
                <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Owner
                </th>
                <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {certificationQueue.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-blue-50"
                >
                  <td className="py-2 font-mono text-xs text-gray-700">
                    {row.id}
                  </td>
                  <td className="py-2 text-gray-700">
                    {row.plateNumber || "-"}
                  </td>
                  <td className="py-2 text-gray-700">
                    {row.orCr?.ownerName ||
                      row.crCr?.ownerName ||
                      "-"}
                  </td>
                  <td className="py-2 text-gray-600">
                    {row.status || "OR_CR_UPLOADED"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
