import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { FileUpload } from "../../components/FileUpload";
import { Spinner } from "../../components/Spinner";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  Car,
  CreditCard,
  Ticket,
  Shield,
  Upload,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
} from "lucide-react";

const STEPS = [
  "Vehicle Info",
  "Payment",
  "Voucher",
  "HPG Verification",
  "Upload MVCC/MEC",
  "Issue Certificate",
];

const initialVehicle = {
  plateNumber: "",
  mvFileNumber: "",
  engineNumber: "",
  chassisNumber: "",
  make: "",
  series: "",
  yearModel: "",
  color: "",
  ownerName: "",
  ownerAddress: "",
};

export const ClearanceRequestFlow = ({ role, onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState(initialVehicle);
  const [ocrText, setOcrText] = useState("");
  const [orcrFile, setOrcrFile] = useState(null);
  const [orcrPreview, setOrcrPreview] = useState(null);
  const [paymentDone, setPaymentDone] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherAssigned, setVoucherAssigned] = useState(false);
  const [hpgVerified, setHpgVerified] = useState(false);
  const [mvcFile, setMvcFile] = useState(null);
  const [mvcPreview, setMvcPreview] = useState(null);
  const [mvcOcrText, setMvcOcrText] = useState("");
  const [certificateNo, setCertificateNo] = useState("");
  const [awaitingHpg, setAwaitingHpg] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);

  const updateVehicle = (field, value) =>
    setVehicle((prev) => ({ ...prev, [field]: value }));

  const handleOrcrUpload = (file, preview) => {
    setOrcrFile(file);
    setOrcrPreview(preview);
  };

  const handleMvcUpload = (file, preview) => {
    setMvcFile(file);
    setMvcPreview(preview);
  };

  const handleMarkPaid = () => {
    setPaymentDone(true);
  };

  const handleAssignVoucher = () => {
    if (!voucherCode.trim()) return;
    setVoucherAssigned(true);
  };

  const handleProceedHpg = () => {
    setAwaitingHpg(true);
    setTimeout(() => {
      setAwaitingHpg(false);
      setHpgVerified(true);
    }, 2500);
  };

  const handleIssueCertificate = () => {
    setIsIssuing(true);
    setTimeout(() => {
      setIsIssuing(false);
      const no = "DCI-CERT-" + Date.now().toString().slice(-8);
      setCertificateNo(no);
    }, 2000);
  };

  const handleDownload = () => {
    const blob = new Blob(
      [`Clearance Certificate: ${certificateNo}\nIssued for plate: ${vehicle.plateNumber}`],
      { type: "text/plain" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${certificateNo}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canNext = () => {
    if (step === 1) return vehicle.plateNumber && vehicle.ownerName;
    if (step === 2) return paymentDone;
    if (step === 3) return voucherAssigned;
    if (step === 4) return hpgVerified;
    if (step === 5) return mvcFile !== null;
    return false;
  };

  const nextStep = () => {
    if (step < 6 && canNext()) {
      if (step === 4) {
        setStep(5);
      } else {
        setStep(step + 1);
      }
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const finish = () => {
    onComplete?.({ certificateNo, vehicle });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">
              Clearance Request
            </span>
            <span className="text-xs text-gray-500 ml-auto">
              {role === "agent_fixer" ? "Agent / Fixer" : "Citizen"}
            </span>
          </div>

          <div className="px-6 py-4 bg-[#0059b5]">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => {
                const idx = i + 1;
                const isCompleted = step > idx;
                const isActive = step === idx;
                return (
                  <div key={i} className="flex-1 text-center relative">
                    <div
                      className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                        ${isCompleted ? "bg-white text-[#0059b5]" : ""}
                        ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""}
                        ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        idx
                      )}
                    </div>
                    <p
                      className={`text-xs mt-2 ${
                        isActive ? "text-white font-medium" : "text-white/50"
                      }`}
                    >
                      {s}
                    </p>
                    {i < STEPS.length - 1 && (
                      <div
                        className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2
                          ${isCompleted ? "bg-white" : "bg-white/30"}`}
                        style={{
                          width: "calc(100% - 2rem)",
                          left: "calc(50% + 1rem)",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {step === 1 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Upload size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    Upload OR/CR Image
                  </h3>
                </div>
                <FileUpload
                  label="OR/CR Image"
                  accept="image/*"
                  onFile={handleOrcrUpload}
                  preview={orcrPreview}
                />
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    OCR Data
                  </h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paste or type vehicle details from OCR
                  </label>
                  <textarea
                    value={ocrText}
                    onChange={(e) => setOcrText(e.target.value)}
                    placeholder="Paste OCR extracted text here..."
                    rows={4}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Car size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    Vehicle Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Plate Number"
                    value={vehicle.plateNumber}
                    onChange={(e) => updateVehicle("plateNumber", e.target.value)}
                    placeholder="e.g. ABC1234"
                    required
                  />
                  <Input
                    label="MV File Number"
                    value={vehicle.mvFileNumber}
                    onChange={(e) => updateVehicle("mvFileNumber", e.target.value)}
                    placeholder="e.g. 13242500000003A"
                  />
                  <Input
                    label="Engine Number"
                    value={vehicle.engineNumber}
                    onChange={(e) => updateVehicle("engineNumber", e.target.value)}
                    placeholder="Engine no."
                  />
                  <Input
                    label="Chassis Number"
                    value={vehicle.chassisNumber}
                    onChange={(e) => updateVehicle("chassisNumber", e.target.value)}
                    placeholder="Chassis no."
                  />
                  <Input
                    label="Make"
                    value={vehicle.make}
                    onChange={(e) => updateVehicle("make", e.target.value)}
                    placeholder="e.g. TOYOTA"
                  />
                  <Input
                    label="Series"
                    value={vehicle.series}
                    onChange={(e) => updateVehicle("series", e.target.value)}
                    placeholder="e.g. VIOS"
                  />
                  <Input
                    label="Year Model"
                    value={vehicle.yearModel}
                    onChange={(e) => updateVehicle("yearModel", e.target.value)}
                    placeholder="e.g. 2020"
                  />
                  <Input
                    label="Color"
                    value={vehicle.color}
                    onChange={(e) => updateVehicle("color", e.target.value)}
                    placeholder="e.g. WHITE"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Shield size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    Owner Information
                  </h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <Input
                    label="Owner Name"
                    value={vehicle.ownerName}
                    onChange={(e) => updateVehicle("ownerName", e.target.value)}
                    placeholder="Full name of registered owner"
                    required
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Owner Address
                    </label>
                    <textarea
                      value={vehicle.ownerAddress}
                      onChange={(e) =>
                        updateVehicle("ownerAddress", e.target.value)
                      }
                      placeholder="Complete address"
                      rows={3}
                      className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Payment
                </h3>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">Clearance Fee</p>
                <p className="text-3xl font-bold text-gray-900">PHP 500.00</p>
              </div>

              {paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Payment Completed</p>
                  <p className="text-xs text-green-600 mt-1">
                    Your clearance fee has been paid successfully.
                  </p>
                </div>
              ) : (
                <Button onClick={handleMarkPaid} className="w-full">
                  <CreditCard size={16} />
                  Mark as Paid
                </Button>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Voucher</h3>
              </div>

              <div className="space-y-4">
                <Input
                  label="Voucher Code"
                  value={voucherCode}
                  onChange={(e) =>
                    setVoucherCode(e.target.value.toUpperCase())
                  }
                  placeholder="Enter voucher code"
                />

                {role === "agent_fixer" && (
                  <Button
                    onClick={handleAssignVoucher}
                    disabled={!voucherCode.trim() || voucherAssigned}
                    variant="outline"
                    className="w-full"
                  >
                    <Ticket size={16} />
                    Assign Voucher
                  </Button>
                )}

                {voucherAssigned && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                    <p className="font-semibold text-green-700">
                      Voucher Assigned
                    </p>
                    <p className="text-xs text-green-600 mt-1 font-mono">
                      {voucherCode}
                    </p>
                  </div>
                )}

                {!voucherAssigned && role === "citizen" && (
                  <p className="text-xs text-gray-400 text-center">
                    Enter your voucher code above to proceed
                  </p>
                )}
              </div>
            </Card>
          )}

          {step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Shield size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  HPG Verification
                </h3>
              </div>

              {awaitingHpg && (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    Awaiting HPG verification...
                  </p>
                </div>
              )}

              {hpgVerified && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={32} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700 text-lg">
                    HPG Verified
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    The vehicle has been verified by HPG.
                  </p>
                </div>
              )}

              {!awaitingHpg && !hpgVerified && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Submit for HPG verification
                  </p>
                  <Button onClick={handleProceedHpg}>
                    <Shield size={16} />
                    Proceed to HPG Verification
                  </Button>
                </div>
              )}
            </Card>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Upload size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    Upload MVCC/MEC Image
                  </h3>
                </div>
                <FileUpload
                  label="MVC/MEC Image"
                  accept="image/*"
                  onFile={handleMvcUpload}
                  preview={mvcPreview}
                />
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    MVCC/MEC OCR Data
                  </h3>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paste or type MVCC/MEC details
                  </label>
                  <textarea
                    value={mvcOcrText}
                    onChange={(e) => setMvcOcrText(e.target.value)}
                    placeholder="Paste MVC/MEC OCR extracted text..."
                    rows={4}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Car size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">
                    Vehicle Details (pre-filled)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      Plate Number
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.plateNumber || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      MV File Number
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.mvFileNumber || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      Make
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.make || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      Series
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.series || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      Year Model
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.yearModel || "—"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <label className="text-xs text-gray-500 block mb-1">
                      Owner Name
                    </label>
                    <p className="text-sm font-medium text-gray-900">
                      {vehicle.ownerName || "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {step === 6 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">
                  Issue Clearance Certificate
                </h3>
              </div>

              {isIssuing && (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">
                    Issuing certificate...
                  </p>
                </div>
              )}

              {certificateNo && !isIssuing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 text-lg">
                    Clearance Certificate Issued
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">
                    {certificateNo}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plate: {vehicle.plateNumber}
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handleDownload} variant="outline">
                      <Download size={16} />
                      Download Certificate
                    </Button>
                    <Button onClick={finish}>
                      <CheckCircle size={16} />
                      Complete
                    </Button>
                  </div>
                </div>
              )}

              {!certificateNo && !isIssuing && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">
                    Ready to issue the clearance certificate
                  </p>
                  <Button onClick={handleIssueCertificate}>
                    <FileText size={16} />
                    Issue Certificate
                  </Button>
                </div>
              )}
            </Card>
          )}

          {step < 6 || (step === 6 && certificateNo && !isIssuing) ? (
            <div className="flex justify-between mt-6">
              <div>
                {step > 1 ? (
                  <Button variant="secondary" onClick={prevStep}>
                    <ChevronLeft size={16} /> Previous
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={onCancel}>
                    <X size={16} /> Cancel
                  </Button>
                )}
              </div>
              {step < 5 ? (
                <Button onClick={nextStep} disabled={!canNext()}>
                  Next <ChevronRight size={16} />
                </Button>
              ) : step === 5 ? (
                <Button onClick={nextStep} disabled={!canNext()}>
                  Next <ChevronRight size={16} />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
