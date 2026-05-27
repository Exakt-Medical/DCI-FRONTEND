import { Shield } from "lucide-react";

export const RegistrationHeader = () => {
  return (
    <div className="bg-primary-600 rounded-t-xl overflow-hidden">
      <div className="px-6 py-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-white font-semibold text-sm">
            Vehicle Verification Insurance Program
          </h1>
        </div>
        <span className="text-xs font-bold text-primary-600 bg-white px-3 py-1 rounded-full">
          VVIP
        </span>
      </div>
    </div>
  );
};
