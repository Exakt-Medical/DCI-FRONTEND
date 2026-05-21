import { Input } from "../../../components/Input";

const insuranceCodesList = [
  { code: "PRIVATE CARS (INCLUDING JEEPS AND AUVS)", label: "Private Cars (Including Jeeps and AUVs)" },
  { code: "MOTORCYCLES", label: "Motorcycles" },
  { code: "COMMERCIAL VEHICLES", label: "Commercial Vehicles" },
  { code: "HEAVY EQUIPMENT", label: "Heavy Equipment" },
  { code: "TAXI/PUBLIC UTILITY VEHICLES", label: "Taxi/Public Utility Vehicles" },
];

export const InsuranceFormSection = ({ 
  insuranceData, 
  onInsuranceCodeChange, 
  onPolicyNumberChange,
  disabled 
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">
            Insurance Code <span className="text-red-500">*</span>
          </label>
          <select
            value={insuranceData.selectedCode}
            onChange={(e) => onInsuranceCodeChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            required
            disabled={disabled}
          >
            <option value="">Select Insurance Code</option>
            {insuranceCodesList.map(code => (
              <option key={code.code} value={code.code}>{code.label}</option>
            ))}
          </select>
        </div>
        
        <Input 
          label="Policy Number"
          value={insuranceData.policyNumber}
          onChange={(e) => onPolicyNumberChange(e.target.value)}
          placeholder="Enter Policy Number"
          required
          disabled={disabled}
        />
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4 mt-2">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Premium Breakdown</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Prescribed Premium</label>
            <p className="text-sm font-medium text-gray-900">₱ {insuranceData.prescribedPremiumFee || "0.00"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">DST</label>
            <p className="text-sm font-medium text-gray-900">₱ {insuranceData.dst || "0.00"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">VAT</label>
            <p className="text-sm font-medium text-gray-900">₱ {insuranceData.vat || "0.00"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">LGT</label>
            <p className="text-sm font-medium text-gray-900">₱ {insuranceData.lgt || "0.00"}</p>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Validation Fee</label>
            <p className="text-sm font-medium text-gray-900">₱ {insuranceData.validationFee || "0.00"}</p>
          </div>
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-gray-700">Total Amount:</label>
            <p className="text-lg font-bold text-primary-600">₱ {insuranceData.totalAmount || "0.00"}</p>
          </div>
        </div>
      </div>

      <div className="bg-green-50 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Redeemed On:</span>
          <span className="text-sm font-medium text-green-700">
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </>
  );
};