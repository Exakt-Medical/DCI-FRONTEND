import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import { Search, FileText, CheckCircle, Car, User, Calendar } from "lucide-react";

const MOCK_CERTIFICATE = {
  referenceNo: "DCI-CLR-2026-0003",
  plateNumber: "DEF9012",
  ownerName: "Maria Clara Santos",
  make: "HONDA",
  series: "CITY",
  yearModel: "2021",
  status: "VALID",
  issueDate: "2026-05-25",
  certificateNo: "DCI-CERT-12345678",
};

const STATUS_STYLES = {
  VALID: { bg: "bg-green-100", text: "text-green-700", dot: "bg-green-500" },
  EXPIRED: { bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
  REVOKED: { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-500" },
};

export const LtoLookupPage = () => {
  const [certNo, setCertNo] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!certNo.trim()) {
      setError("Please enter a certificate number");
      return;
    }
    setIsSearching(true);
    setError("");

    setTimeout(() => {
      setIsSearching(false);
      setSearched(true);
      if (certNo === "DCI-CERT-12345678") {
        setCertificate(MOCK_CERTIFICATE);
        setError("");
      } else {
        setCertificate(null);
        setError("Certificate not found. Please check the number and try again.");
      }
    }, 1500);
  };

  const handleReset = () => {
    setCertNo("");
    setCertificate(null);
    setError("");
    setSearched(false);
  };

  const statusStyle = certificate
    ? STATUS_STYLES[certificate.status] || STATUS_STYLES.VALID
    : null;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          LTO Certificate Lookup
        </h1>
        <p className="text-sm text-gray-500">
          Verify DCI clearance certificates issued to vehicles
        </p>
      </div>

      <Card className="p-5 mb-5">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
          <FileText size={18} className="text-[#0059b5]" />
          <h3 className="text-base font-bold text-gray-900">
            Certificate Search
          </h3>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <Input
          label="Certificate Number"
              value={certNo}
              onChange={(e) => setCertNo(e.target.value.toUpperCase())}
              placeholder="Enter certificate number (e.g., DCI-CERT-XXXXXXXX)"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isSearching || !certNo.trim()}
          >
            {isSearching ? <Spinner size="sm" /> : <Search size={16} />}
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        {error && (
          <p className="text-xs text-red-500 mt-2">{error}</p>
        )}
      </Card>

      {searched && !certificate && !error && (
        <Card className="p-5">
          <div className="text-center py-6">
            <FileText size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No certificate found</p>
          </div>
        </Card>
      )}

      {certificate && (
        <>
          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <FileText size={18} className="text-[#0059b5]" />
              <h3 className="text-base font-bold text-gray-900">
                Certificate Details
              </h3>
              <span className="ml-auto">
                {statusStyle && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                    />
                    {certificate.status}
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Certificate No.
                </label>
                <p className="text-sm font-mono font-bold text-gray-900">
                  {certificate.certificateNo}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Reference No.
                </label>
                <p className="text-sm font-mono font-medium text-gray-900">
                  {certificate.referenceNo}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Issue Date
                </label>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                  <Calendar size={14} className="text-gray-400" />
                  {certificate.issueDate}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Status
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.status}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <Car size={18} className="text-[#0059b5]" />
              <h3 className="text-base font-bold text-gray-900">
                Vehicle Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Plate Number
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.plateNumber}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Make
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.make}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Series
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.series}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="text-xs text-gray-500 block mb-1">
                  Year Model
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {certificate.yearModel}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
              <User size={18} className="text-[#0059b5]" />
              <h3 className="text-base font-bold text-gray-900">
                Owner Information
              </h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <label className="text-xs text-gray-500 block mb-1">
                Owner Name
              </label>
              <p className="text-sm font-medium text-gray-900">
                {certificate.ownerName}
              </p>
            </div>
          </Card>

          <div className="flex justify-start">
            <Button variant="secondary" onClick={handleReset}>
              New Search
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
