import { CheckCircle, Clock } from "lucide-react";

export const SuccessState = ({ refNum }) => {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Registration Submitted!
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Your registration is under review. You'll receive a confirmation email
        within 1-2 business days.
      </p>
      <div className="inline-flex items-center gap-2 bg-primary-50 px-4 py-2 rounded-lg">
        <Clock className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-medium text-primary-600">
          Reference: {refNum}
        </span>
      </div>
    </div>
  );
};
