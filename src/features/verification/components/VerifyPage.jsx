import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle, Car, Shield, XCircle, Loader, User } from "lucide-react";
import DOTRLogo from "../../../assets/DOTR-LOGO.png";
import LTOLogo from "../../../assets/LTO-LOGO.png";
import { verificationService } from "../../../services/verificationService";

export const VerifyPage = () => {
  const { authNo } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCert = async () => {
      try {
        const res = await verificationService.getByCertNo(authNo);
        setData(res.data);
      } catch (e) {
        setError("Certificate not found or could not be verified.");
      } finally {
        setLoading(false);
      }
    };
    fetchCert();
  }, [authNo]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader size={32} className="animate-spin text-primary-600" />
          <p className="text-sm">Verifying certificate...</p>
        </div>
      </div>
    );

  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-red-200">
          <XCircle size={48} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Verification Failed
          </h2>
          <p className="text-sm text-gray-500">{error || "No data found."}</p>
          <p className="text-xs text-gray-400 mt-3 font-mono break-all">
            Auth No: {authNo}
          </p>
        </div>
      </div>
    );

  const {
    issuedDate,
    issuer,
    // vehicle fields
    mvFileNo,
    plateNumber,
    engineNumber,
    chassisNumber,
    make,
    series,
    color,
    yearModel,
    classification,
    denomination,
    // owner fields
    ownerFirstName,
    ownerMiddleName,
    ownerLastName,
    ownerAddress,
    // insurance
    premiumType,
  } = data;

  const ownerFullName =
    [ownerFirstName, ownerMiddleName, ownerLastName]
      .filter(Boolean)
      .join(" ") || "—";

  const Field = ({ label, value }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">
        {label}
      </p>
      <p className="text-gray-900 font-semibold text-xs">{value || "—"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header card */}
        <div className="bg-gradient-to-r from-primary-600 to-blue-900 rounded-2xl p-6 text-white mb-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <img
              src={DOTRLogo}
              alt="DOTR"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
            <div className="text-center">
              <p className="text-[10px] text-white/50 uppercase tracking-widest">
                Republic of the Philippines
              </p>
              <p className="font-bold tracking-wide text-sm">
                LAND TRANSPORTATION OFFICE
              </p>
              <p className="text-[10px] text-white/60">
                Vehicle Verification Insurance Program
              </p>
            </div>
            <img
              src={LTOLogo}
              alt="LTO"
              className="h-12 w-12 object-contain"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          </div>

          <div className="border-t border-white/10 pt-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CheckCircle size={20} className="text-green-400" />
              <span className="text-green-300 font-bold text-lg tracking-wide">
                Transaction Verified
              </span>
            </div>
            <p className="text-[10px] text-white/40">
              Motor Vehicle Insurance and Registration Verification
            </p>
          </div>

          <div className="mt-4 flex justify-between text-xs">
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-widest">
                Authentication No.
              </p>
              <p className="font-mono text-blue-300 font-bold">{authNo}</p>
            </div>
            <div className="text-right">
              <p className="text-white/40 text-[10px] uppercase tracking-widest">
                Issued
              </p>
              <p className="text-white/80">{issuedDate || "—"}</p>
            </div>
          </div>
        </div>

        {/* Vehicle Information */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <Car size={12} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Vehicle Information
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field
              label="Make & Model"
              value={`${make || ""} ${series || ""}`.trim()}
            />
            <Field label="MV File No." value={mvFileNo} />
            <Field label="Engine No." value={engineNumber} />
            <Field label="Chassis No." value={chassisNumber} />
            <Field label="Plate No." value={plateNumber} />
            <Field label="Color" value={color} />
            <Field label="Vehicle Type / Denomination" value={denomination} />
            <Field label="Year Model" value={yearModel} />
            <Field label="Classification" value={classification} />
            <Field label="Premium Type" value={premiumType} />
          </div>
        </div>

        {/* Owner Information */}
        <div className="bg-white rounded-2xl shadow p-5 mb-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <User size={12} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Owner Information
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Full Name" value={ownerFullName} />
            <Field label="Address" value={ownerAddress} />
          </div>
        </div>

        {/* Inspection Details */}
        <div className="bg-white rounded-2xl shadow p-5 border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 bg-primary-600 rounded flex items-center justify-center">
              <Shield size={12} className="text-white" />
            </div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Inspection Details
            </h3>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Field label="DCI Authentication Code" value={authNo} />
            <Field label="Date of Validation" value={issuedDate} />
            <Field label="Issuer" value={issuer || "PREMIER INSURANCE CORP."} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          This certificate was digitally issued by the Land Transportation
          Office - VVIP System.
        </p>
      </div>
    </div>
  );
};
