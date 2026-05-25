import { Wrench, Shield, MessageCircle, RefreshCw } from "lucide-react";
import DciLogo from "../../assets/DCI-LOGO.png";

export const MaintenancePage = () => {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-2 bg-primary-600" />

          <div className="p-8 text-center">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src={DciLogo} alt="DCI Logo" className="h-16 w-auto" />
            </div>

            {/* Icon */}
            <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-10 h-10 text-primary-600 animate-bounce" />
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Under Maintenance
            </h1>

            <div className="w-16 h-1 bg-primary-600 mx-auto rounded-full mb-4" />

            <p className="text-gray-600 text-sm mb-6">
              We're currently performing scheduled maintenance to improve your
              experience. Please check back soon.
            </p>

            {/* Status */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">
                  Estimated downtime: ~2 hours
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleRefresh}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Check Status
              </button>

              <a
                href="mailto:support@vvipctpl.com"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contact Support
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
            <p className="text-center text-xs text-gray-400">
              © 2026 Vehicle Verification Insurance Program
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
