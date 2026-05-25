import {
  Building2,
  UserCircle,
  ClipboardCheck,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";
import { Button } from "../../../components/Button";
import { Spinner } from "../../../components/Spinner";

export const ConfirmStep = ({
  company,
  profile,
  onBack,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <ClipboardCheck className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Review & Confirm</h2>
          <p className="text-sm text-gray-500">
            Verify all information before submitting
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Building2 className="w-3 h-3" /> Company
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{company.name || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Code:</span>
              <span>{company.code || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Branch:</span>
              <span>{company.branch || "—"}</span>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="text-xs font-bold text-primary-600 uppercase tracking-wide mb-3 flex items-center gap-2">
            <UserCircle className="w-3 h-3" /> Profile
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">
                {[profile.firstName, profile.middleName, profile.lastName]
                  .filter(Boolean)
                  .join(" ") || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Email:</span>
              <span className="truncate">{profile.email || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Mobile:</span>
              <span>{profile.mobile || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5" />
        <p className="text-xs text-amber-700">
          Please review all information carefully before submitting.
        </p>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Spinner size="sm" /> Submitting...
            </>
          ) : (
            "Submit Registration"
          )}
        </Button>
      </div>
    </>
  );
};
