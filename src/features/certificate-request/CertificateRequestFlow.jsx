import { useEffect, useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { FileUpload } from "../../components/FileUpload";
import { Spinner } from "../../components/Spinner";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  CreditCard,
  Ticket,
  Upload,
  FileText,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  AlertTriangle,
} from "lucide-react";

const STEPS = ["Upload OR/CR", "Pay", "Issue Voucher", "Go To HPG", "Upload MVC/MEC", "Issue Certificate"];

const emptyVehicle = {
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

const emptyMvc = {
  mvcNo: "",
  mvcIssueDate: "",
  mvcValidUntil: "",
  mvcStatus: "",
};

const emptyMec = {
  mecNo: "",
  mecIssueDate: "",
  mecValidUntil: "",
  mecCo2: "",
  mecHc: "",
  mecResult: "",
};

const makeRequestId = () => `REQ-${Date.now()}`;

export const CertificateRequestFlow = ({ role, initialRequest, onSaveRequest, onComplete, onCancel }) => {
  const [requestId] = useState(() => initialRequest?.requestId || makeRequestId());
  const [step, setStep] = useState(() => initialRequest?.currentStep || 1);
  const [requestStatus, setRequestStatus] = useState(() => initialRequest?.status || "DRAFT");
  const [dateCreated] = useState(() => initialRequest?.dateCreated || new Date().toISOString().split("T")[0]);

  const [orPreview, setOrPreview] = useState(initialRequest?.orPreview || null);
  const [orNumber, setOrNumber] = useState(initialRequest?.orNumber || "");
  const [orDate, setOrDate] = useState(initialRequest?.orDate || "");
  const [orAmount, setOrAmount] = useState(initialRequest?.orAmount || "");
  const [orCr, setOrCr] = useState(() => initialRequest?.orCr || emptyVehicle);

  const [crPreview, setCrPreview] = useState(initialRequest?.crPreview || null);
  const [crNumber, setCrNumber] = useState(initialRequest?.crNumber || "");
  const [crCr, setCrCr] = useState(() => initialRequest?.crCr || emptyVehicle);

  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentDone, setPaymentDone] = useState(Boolean(initialRequest?.paymentDone));

  const [issuingVoucher, setIssuingVoucher] = useState(false);
  const [voucherCode, setVoucherCode] = useState(initialRequest?.voucherCode || "");
  const [voucherAssigned, setVoucherAssigned] = useState(Boolean(initialRequest?.voucherAssigned || initialRequest?.voucherCode));

  const [hpgVerified, setHpgVerified] = useState(Boolean(initialRequest?.hpgVerified));

  const [mvcPreview, setMvcPreview] = useState(initialRequest?.mvcPreview || null);
  const [mvcFileName, setMvcFileName] = useState(initialRequest?.mvcFileName || "");
  const [mvcData, setMvcData] = useState(() => initialRequest?.mvcData || emptyMvc);

  const [mecPreview, setMecPreview] = useState(initialRequest?.mecPreview || null);
  const [mecFileName, setMecFileName] = useState(initialRequest?.mecFileName || "");
  const [mecData, setMecData] = useState(() => initialRequest?.mecData || emptyMec);

  const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
  const [certificateNo, setCertificateNo] = useState(initialRequest?.certificateNo || "");

  const updateOrCr = (field, value) => setOrCr((prev) => ({ ...prev, [field]: value }));
  const updateCrCr = (field, value) => setCrCr((prev) => ({ ...prev, [field]: value }));

  const plateMismatch = Boolean(orCr.plateNumber && crCr.plateNumber && orCr.plateNumber !== crCr.plateNumber);

  const saveRequest = (overrides = {}) => {
    const record = {
      requestId,
      dateCreated,
      currentStep: step,
      status: requestStatus,
      role,
      plateNumber: orCr.plateNumber || crCr.plateNumber || initialRequest?.plateNumber || "",
      voucherCode,
      voucherAssigned,
      paymentDone,
      hpgVerified,
      certificateNo,
      orNumber,
      orDate,
      orAmount,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
      mvcPreview,
      mecPreview,
      mvcFileName,
      mecFileName,
      mvcData,
      mecData,
      ...overrides,
    };

    onSaveRequest?.(record);
    return record;
  };

  const handleOrUpload = (file, preview) => {
    setOrPreview(preview);
    if (!file) return;

    setOrNumber("Extracting...");
    setOrDate("Extracting...");
    setOrAmount("Extracting...");
    updateOrCr("plateNumber", "Extracting...");

    setTimeout(() => {
      setOrNumber(`OR-${String(Date.now()).slice(-8)}`);
      setOrDate(new Date().toISOString().split("T")[0]);
      setOrAmount("PHP 500.00");
      updateOrCr("plateNumber", orCr.plateNumber && orCr.plateNumber !== "Extracting..." ? orCr.plateNumber : "ABC1234");
      updateOrCr("mvFileNumber", "13242500000003A");
      updateOrCr("engineNumber", `ENG-${String(Math.random()).slice(2, 8)}`);
      updateOrCr("chassisNumber", `CHA-${String(Math.random()).slice(2, 8)}`);
      updateOrCr("make", "TOYOTA");
      updateOrCr("series", "VIOS");
      updateOrCr("yearModel", "2020");
      updateOrCr("color", "WHITE");
      updateOrCr("ownerName", "JUAN DELA CRUZ");
      updateOrCr("ownerAddress", "123 Rizal St., Manila");
    }, 1200);
  };

  const handleCrUpload = (file, preview) => {
    setCrPreview(preview);
    if (!file) return;

    setCrNumber("Extracting...");
    updateCrCr("plateNumber", "Extracting...");

    setTimeout(() => {
      setCrNumber(`CR-${String(Date.now()).slice(-8)}`);
      updateCrCr("plateNumber", crCr.plateNumber && crCr.plateNumber !== "Extracting..." ? crCr.plateNumber : "ABC1234");
      updateCrCr("mvFileNumber", "13242500000003A");
      updateCrCr("engineNumber", `ENG-${String(Math.random()).slice(2, 8)}`);
      updateCrCr("chassisNumber", `CHA-${String(Math.random()).slice(2, 8)}`);
      updateCrCr("make", "TOYOTA");
      updateCrCr("series", "VIOS");
      updateCrCr("yearModel", "2020");
      updateCrCr("color", "WHITE");
      updateCrCr("ownerName", "JUAN DELA CRUZ");
      updateCrCr("ownerAddress", "123 Rizal St., Manila");
    }, 1200);
  };

  const canNext = () => {
    if (step === 1) {
      const orOk = orCr.plateNumber && orCr.ownerName && orCr.plateNumber !== "Extracting...";
      const crOk = crCr.plateNumber && crCr.ownerName && crCr.plateNumber !== "Extracting...";
      return Boolean(orOk && crOk && !plateMismatch);
    }

    if (step === 2) return paymentDone;
    if (step === 3) return voucherAssigned;
    if (step === 4) return hpgVerified;
    if (step === 5) return Boolean(mvcData.mvcNo && mecData.mecNo);
    return false;
  };

  const handleProceedToPayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentDone(true);
      setRequestStatus("PENDING");
      setStep(3);
      const rec = saveRequest({ currentStep: 3, status: "PENDING", paymentDone: true });
      // persist immediately so user can leave site
      // onSaveRequest already writes to parent store
      if (rec) {
        // no-op
      }
    }, 1600);
  };

  useEffect(() => {
    if (step === 3 && paymentDone && !voucherAssigned && !issuingVoucher) {
      setIssuingVoucher(true);
      setTimeout(() => {
        const code = voucherCode || `VCH-${String(Date.now()).slice(-8)}`;
        setVoucherCode(code);
        setVoucherAssigned(true);
        setIssuingVoucher(false);
        setRequestStatus("VOUCHER_ISSUED");
        saveRequest({ currentStep: 4, status: "VOUCHER_ISSUED", voucherCode: code, voucherAssigned: true });
        setStep(4);
      }, 900);
    }
  }, [step, paymentDone, voucherAssigned, issuingVoucher]);

  const handleCitizenHpgVerify = () => {
    setHpgVerified(true);
    setRequestStatus("HPG_VERIFIED");
    setStep(5);
    saveRequest({ currentStep: 5, status: "HPG_VERIFIED", hpgVerified: true });
  };

  const handleMvcUpload = (file, preview) => {
    setMvcPreview(preview);
    setMvcFileName(file?.name || "");
    if (!file) return;

    setMvcData((prev) => ({
      ...prev,
      mvcNo: "Extracting...",
      mvcIssueDate: "Extracting...",
      mvcValidUntil: "Extracting...",
      mvcStatus: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        mvcNo: `MVC-${String(Date.now()).slice(-8)}`,
        mvcIssueDate: new Date().toISOString().split("T")[0],
        mvcValidUntil: "2026-12-31",
        mvcStatus: "CLEAR",
      };
      setMvcData(next);
      saveRequest({ currentStep: 5, status: "MVC_MEC_UPLOADED", mvcData: next, mvcPreview: preview, mvcFileName: file.name });
    }, 1200);
  };

  const handleMecUpload = (file, preview) => {
    setMecPreview(preview);
    setMecFileName(file?.name || "");
    if (!file) return;

    setMecData((prev) => ({
      ...prev,
      mecNo: "Extracting...",
      mecIssueDate: "Extracting...",
      mecValidUntil: "Extracting...",
      mecCo2: "Extracting...",
      mecHc: "Extracting...",
      mecResult: "Extracting...",
    }));

    setTimeout(() => {
      const next = {
        mecNo: `MEC-${String(Date.now()).slice(-8)}`,
        mecIssueDate: new Date().toISOString().split("T")[0],
        mecValidUntil: "2026-12-31",
        mecCo2: "0.85 g/km",
        mecHc: "0.12 g/km",
        mecResult: "PASS",
      };
      setMecData(next);
      saveRequest({ currentStep: 5, status: "MVC_MEC_UPLOADED", mecData: next, mecPreview: preview, mecFileName: file.name });
    }, 1200);
  };

  const handleIssueCertificate = () => {
    setIsIssuingCertificate(true);
    setTimeout(() => {
      const certNo = `DCI-CERT-${String(Date.now()).slice(-8)}`;
      setCertificateNo(certNo);
      setIsIssuingCertificate(false);
      setRequestStatus("CERTIFICATE_ISSUED");
      saveRequest({ currentStep: 6, status: "CERTIFICATE_ISSUED", certificateNo: certNo });
    }, 1600);
  };

  const handleDownload = () => {
    const blob = new Blob([`Certificate: ${certificateNo}\nVoucher: ${voucherCode}\nPlate: ${orCr.plateNumber}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${certificateNo}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const nextStep = () => {
    if (step < 6 && canNext()) setStep((prev) => prev + 1);
  };

  const canPrev = () => {
    // cannot go back if certificate has been issued
    if (certificateNo) return false;
    // cannot go back while payment is processing
    if (processingPayment) return false;
    // after payment is done, disallow going back to steps before payment (steps 1-2)
    // allow navigating between post-payment steps (3-5)
    if (paymentDone) {
      const target = step - 1;
      if (target < 3) return false;
    }
    return step > 1;
  };

  const prevStep = () => {
    if (!canPrev()) return;
    setStep((prev) => prev - 1);
  };

  const finish = () => {
    onComplete?.({
      requestId,
      voucherCode,
      certificateNo,
      vehicle: orCr,
      orCr,
      crCr,
      orNumber,
      orDate,
      orAmount,
      crNumber,
      dateCreated,
    });
  };

  const VehicleFields = ({ values, onChange }) => (
    <div className="space-y-3">
      <Input label="Plate Number" value={values.plateNumber} onChange={(e) => onChange("plateNumber", e.target.value)} placeholder="Auto-extracted" required />
      <Input label="MV File Number" value={values.mvFileNumber} onChange={(e) => onChange("mvFileNumber", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Engine Number" value={values.engineNumber} onChange={(e) => onChange("engineNumber", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Chassis Number" value={values.chassisNumber} onChange={(e) => onChange("chassisNumber", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Make" value={values.make} onChange={(e) => onChange("make", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Series" value={values.series} onChange={(e) => onChange("series", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Year Model" value={values.yearModel} onChange={(e) => onChange("yearModel", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Color" value={values.color} onChange={(e) => onChange("color", e.target.value)} placeholder="Auto-extracted" />
      <Input label="Owner Name" value={values.ownerName} onChange={(e) => onChange("ownerName", e.target.value)} placeholder="Auto-extracted" required />
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner Address</label>
        <textarea value={values.ownerAddress} onChange={(e) => onChange("ownerAddress", e.target.value)} placeholder="Auto-extracted" rows={3} className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Request Certificate</span>
            <span className="text-xs text-gray-500 ml-auto">{role === "agent_fixer" ? "Agent / Fixer" : "Citizen"}</span>
          </div>

          <div className="px-6 py-4 bg-[#0059b5]">
            <div className="flex items-center justify-between gap-2">
              {STEPS.map((label, index) => {
                const idx = index + 1;
                const isCompleted = step > idx;
                const isActive = step === idx;
                return (
                  <div key={label} className="flex-1 text-center relative min-w-0">
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold ${isCompleted ? "bg-white text-[#0059b5]" : ""} ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""} ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx}
                    </div>
                    <p className={`text-[10px] sm:text-xs mt-2 truncate ${isActive ? "text-white font-medium" : "text-white/60"}`}>{label}</p>
                    {index < STEPS.length - 1 && <div className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${isCompleted ? "bg-white" : "bg-white/30"}`} style={{ width: "calc(100% - 2rem)", left: "calc(50% + 1rem)" }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {step === 1 && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <Upload size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">OR</h3>
                  </div>
                  <FileUpload label="Upload Official Receipt" accept="image/*,application/pdf" onFile={handleOrUpload} preview={orPreview} />
                  <div className="mt-4 space-y-3">
                    <Input label="OR Number" value={orNumber} onChange={(e) => setOrNumber(e.target.value)} placeholder="Auto-extracted from OR" />
                    <Input label="OR Date" value={orDate} onChange={(e) => setOrDate(e.target.value)} placeholder="Auto-extracted from OR" />
                    <Input label="Amount" value={orAmount} onChange={(e) => setOrAmount(e.target.value)} placeholder="Auto-extracted from OR" />
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle Details (from OR)</p>
                      <VehicleFields values={orCr} onChange={updateOrCr} />
                    </div>
                  </div>
                </Card>

                <Card className="p-5">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                    <Upload size={18} className="text-[#0059b5]" />
                    <h3 className="text-base font-bold text-gray-900">CR</h3>
                  </div>
                  <FileUpload label="Upload Certificate of Registration" accept="image/*,application/pdf" onFile={handleCrUpload} preview={crPreview} />
                  <div className="mt-4 space-y-3">
                    <Input label="CR Number" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} placeholder="Auto-extracted from CR" />
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Vehicle Details (from CR)</p>
                      <VehicleFields values={crCr} onChange={updateCrCr} />
                    </div>
                  </div>
                </Card>
              </div>
              {plateMismatch && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-700">Plate number mismatch: OR says <strong>{orCr.plateNumber}</strong>, CR says <strong>{crCr.plateNumber}</strong>. Both must match to proceed.</p>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Payment</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">Certificate Request Fee</p>
                <p className="text-3xl font-bold text-gray-900">PHP 800.00</p>
                <p className="text-xs text-gray-500 mt-1">Single payment covers the whole request.</p>
              </div>
              {processingPayment ? (
                <div className="text-center py-4"><Spinner size="md" /><p className="text-sm text-gray-500 mt-2">Processing payment...</p></div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center"><CheckCircle size={24} className="text-green-600 mx-auto mb-2" /><p className="font-semibold text-green-700">Payment Completed</p></div>
              ) : (
                <Button onClick={handleProceedToPayment} className="w-full"><CreditCard size={16} /> Proceed to Payment</Button>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Issue Voucher</h3>
              </div>
              {issuingVoucher ? (
                <div className="text-center py-5"><Spinner size="md" /><p className="text-sm text-gray-500 mt-2">Generating voucher...</p></div>
              ) : voucherAssigned ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"><CheckCircle size={40} className="text-green-600 mx-auto mb-3" /><p className="font-semibold text-green-700 text-lg">Voucher Issued</p><p className="text-sm font-mono font-bold text-gray-900 mt-2">{voucherCode}</p><p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p></div>
              ) : (
                <div className="text-center py-6"><p className="text-sm text-gray-500">Voucher issues automatically after payment.</p></div>
              )}
            </Card>
          )}

          {step === 4 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">HPG Pending</h3>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">Please present your voucher to HPG/LTO. In this frontend demo, click the button below to simulate verification.</p>
                <p className="text-xs text-gray-600 mt-2">Voucher Code: <span className="font-mono font-semibold">{voucherCode}</span></p>
              </div>
              <div className="mt-4">
                <Button onClick={handleCitizenHpgVerify}><CheckCircle size={16} /> Has been verified by HPG</Button>
              </div>
            </Card>
          )}

          {step === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200"><Upload size={18} className="text-[#0059b5]" /><h3 className="text-base font-bold text-gray-900">MVC</h3></div>
                <FileUpload label="Upload Motor Vehicle Clearance" accept="image/*,application/pdf" onFile={handleMvcUpload} preview={mvcPreview} />
                <div className="mt-4 space-y-3">
                  <Input label="MVC Number" value={mvcData.mvcNo} onChange={(e) => setMvcData((prev) => ({ ...prev, mvcNo: e.target.value }))} placeholder="Auto-extracted from MVC" />
                  <Input label="Issue Date" value={mvcData.mvcIssueDate} onChange={(e) => setMvcData((prev) => ({ ...prev, mvcIssueDate: e.target.value }))} placeholder="Auto-extracted from MVC" />
                  <Input label="Valid Until" value={mvcData.mvcValidUntil} onChange={(e) => setMvcData((prev) => ({ ...prev, mvcValidUntil: e.target.value }))} placeholder="Auto-extracted from MVC" />
                  <Input label="Status" value={mvcData.mvcStatus} onChange={(e) => setMvcData((prev) => ({ ...prev, mvcStatus: e.target.value }))} placeholder="Auto-extracted from MVC" />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200"><Upload size={18} className="text-[#0059b5]" /><h3 className="text-base font-bold text-gray-900">MEC</h3></div>
                <FileUpload label="Upload Motor Vehicle Emission" accept="image/*,application/pdf" onFile={handleMecUpload} preview={mecPreview} />
                <div className="mt-4 space-y-3">
                  <Input label="MEC Number" value={mecData.mecNo} onChange={(e) => setMecData((prev) => ({ ...prev, mecNo: e.target.value }))} placeholder="Auto-extracted from MEC" />
                  <Input label="Issue Date" value={mecData.mecIssueDate} onChange={(e) => setMecData((prev) => ({ ...prev, mecIssueDate: e.target.value }))} placeholder="Auto-extracted from MEC" />
                  <Input label="Valid Until" value={mecData.mecValidUntil} onChange={(e) => setMecData((prev) => ({ ...prev, mecValidUntil: e.target.value }))} placeholder="Auto-extracted from MEC" />
                  <Input label="CO2" value={mecData.mecCo2} onChange={(e) => setMecData((prev) => ({ ...prev, mecCo2: e.target.value }))} placeholder="Auto-extracted from MEC" />
                  <Input label="HC" value={mecData.mecHc} onChange={(e) => setMecData((prev) => ({ ...prev, mecHc: e.target.value }))} placeholder="Auto-extracted from MEC" />
                  <Input label="Result" value={mecData.mecResult} onChange={(e) => setMecData((prev) => ({ ...prev, mecResult: e.target.value }))} placeholder="Auto-extracted from MEC" />
                </div>
              </Card>
            </div>
          )}

          {step === 6 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200"><FileText size={18} className="text-[#0059b5]" /><h3 className="text-base font-bold text-gray-900">Issue Certificate</h3></div>
              {isIssuingCertificate ? (
                <div className="text-center py-8"><Spinner size="lg" /><p className="text-sm text-gray-500 mt-4">Issuing certificate...</p></div>
              ) : certificateNo ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center"><CheckCircle size={40} className="text-green-600 mx-auto mb-3" /><p className="font-semibold text-green-700 text-lg">Certificate Issued</p><p className="text-sm font-mono font-bold text-gray-900 mt-2">{certificateNo}</p><p className="text-xs text-gray-500 mt-1">Plate: {orCr.plateNumber}</p><div className="mt-4 flex justify-center gap-3"><Button onClick={handleDownload} variant="outline"><Download size={16} /> Download</Button><Button onClick={finish}><CheckCircle size={16} /> Complete</Button></div></div>
              ) : (
                <div className="text-center py-6"><p className="text-sm text-gray-500 mb-4">Ready to issue final certificate.</p><Button onClick={handleIssueCertificate}><FileText size={16} /> Issue Certificate</Button></div>
              )}
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <div>
              {step > 1 ? (
                <Button variant="secondary" onClick={prevStep} disabled={!canPrev()}>
                  <ChevronLeft size={16} /> Previous
                </Button>
              ) : (
                <Button variant="ghost" onClick={onCancel}><X size={16} /> Cancel</Button>
              )}
            </div>
            {step < 6 ? <Button onClick={nextStep} disabled={!canNext()}>Next <ChevronRight size={16} /></Button> : certificateNo ? <Button onClick={finish}><CheckCircle size={16} /> Complete</Button> : null}
          </div>
        </div>
      </div>
    </div>
  );
};
