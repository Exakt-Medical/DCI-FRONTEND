import { Button } from "../../components/Button";
import { generateCertificatePDF } from "../../utils/generateCertificatePDF";
import { FileDown, Printer, ArrowLeft, CheckCircle, Car, User, Shield } from "lucide-react";

export const CertificatePage = ({ result, onBack }) => {
  if (!result) return null;
  const { vehicle, owner, insurance, authNo } = result;
  const issuedDate = new Date().toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

  const handleDownloadPDF = () => {
    generateCertificatePDF({ vehicle, owner, insurance, authNo });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Certificate of Validation</h1>
          <p className="text-sm text-gray-500">Review and print your certificate</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={16} /> New Verification
          </Button>
          <Button onClick={handleDownloadPDF} className="flex items-center gap-2">
            <FileDown size={16} /> Download PDF
          </Button>
          <Button onClick={() => window.print()} className="flex items-center gap-2">
            <Printer size={16} /> Print
          </Button>
        </div>
      </div>

      {/* Certificate Card */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-200" id="certificate">
        {/* Header with Logos */}
        <div className="bg-gradient-to-r from-primary-600 to-sapphire-800 p-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-xl font-bold border border-white/20">VV</div>
              <div>
                <p className="text-[10px] font-bold text-primary-200 tracking-widest uppercase">Republic of the Philippines</p>
                <p className="text-sm font-bold tracking-wide">LAND TRANSPORTATION OFFICE</p>
                <p className="text-[10px] text-white/60">Vehicle Verification Insurance Program</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/50 uppercase tracking-widest">Authentication No.</p>
              <p className="font-mono text-primary-300 font-bold text-sm">{authNo}</p>
              <p className="text-[10px] text-white/50 mt-1">Issued: {issuedDate}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 text-center">
            <h2 className="text-lg font-bold tracking-wider">CERTIFICATE OF VALIDATION</h2>
            <p className="text-[10px] text-white/50">Motor Vehicle Insurance and Registration Verification</p>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-6 space-y-5">
          {/* Vehicle Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <Car size={12} className="text-white" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Vehicle Information</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Plate Number</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.plate_number || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">MV File No.</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.mv_file_number || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Year Model</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.year_model || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Make & Series</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.make || ""} {vehicle.series || ""}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Body Type</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.body_type || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Color</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.color || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Engine No.</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.engine_number || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Chassis No.</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.chassis_number || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Classification</p>
                <p className="text-gray-900 font-semibold text-xs">{vehicle.classification || "—"}</p>
              </div>
            </div>
          </div>

          {/* Owner Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Registered Owner</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Last Name</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.lastName || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">First Name</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.firstName || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Middle Name</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.middleName || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2 col-span-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Address</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.address || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Contact No.</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.contactNo || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Email</p>
                <p className="text-gray-900 font-semibold text-xs">{owner.email || "—"}</p>
              </div>
            </div>
          </div>

          {/* Insurance Information */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
                <Shield size={12} className="text-white" />
              </div>
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Insurance Coverage</h3>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Premium Type</p>
                <p className="text-gray-900 font-semibold text-xs">{insurance.premiumType || "—"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Prescribed Premium Fee</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.prescribedPremiumFee || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Documentary Stamp Tax (DST)</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.dst || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Value Added Tax (VAT)</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.vat || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Local Government Tax (LGT)</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.lgt || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Validation Fee</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.validationFee || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Miscellaneous Fees</p>
                <p className="text-gray-900 font-semibold text-xs">₱ {insurance.miscellaneousFees || "0.00"}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-gray-400 text-[10px] uppercase font-semibold mb-0.5">Total Amount</p>
                <p className="text-gray-900 font-semibold text-xs text-primary-600 font-bold">₱ {insurance.totalAmount || "0.00"}</p>
              </div>
            </div>
          </div>


        </div>

      </div>

      <style>{`
        @media print {
          body > * { display: none !important; }
          #certificate { display: block !important; margin: 0; padding: 0; }
          .bg-gradient-to-r { background: #003a78 !important; }
        }
      `}</style>
    </div>
  );
};