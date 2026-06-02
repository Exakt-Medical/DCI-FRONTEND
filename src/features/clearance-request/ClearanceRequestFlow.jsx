import { useState } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { FileUpload } from "../../components/FileUpload";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  Upload, FileText, CreditCard, CheckCircle,
  ChevronLeft, ChevronRight, Download, X
} from "lucide-react";

const STEPS = ["Upload MVC/MEC", "Payment", "Issue Certificate"];

export const ClearanceRequestFlow = ({ role, onComplete, onCancel, voucherRequest }) => {
  const [step, setStep] = useState(1);
  const [mvcFile, setMvcFile] = useState(null);
  const [mvcPreview, setMvcPreview] = useState(null);
  const [mvcNo, setMvcNo] = useState("");
  const [mvcIssueDate, setMvcIssueDate] = useState("");
  const [mvcValidUntil, setMvcValidUntil] = useState("");
  const [mvcStatus, setMvcStatus] = useState("");
  const [mecFile, setMecFile] = useState(null);
  const [mecPreview, setMecPreview] = useState(null);
  const [mecNo, setMecNo] = useState("");
  const [mecIssueDate, setMecIssueDate] = useState("");
  const [mecValidUntil, setMecValidUntil] = useState("");
  const [mecCo2, setMecCo2] = useState("");
  const [mecHc, setMecHc] = useState("");
  const [mecResult, setMecResult] = useState("");
  const [paymentDone, setPaymentDone] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [certificateNo, setCertificateNo] = useState("");

  const vehicle = voucherRequest || {};

  const handleMvcUpload = (file, preview) => {
    setMvcFile(file);
    setMvcPreview(preview);
    if (file) {
      setMvcNo("Extracting...");
      setMvcIssueDate("Extracting...");
      setMvcValidUntil("Extracting...");
      setMvcStatus("Extracting...");
      setTimeout(() => {
        setMvcNo(`MVC-${String(Date.now()).slice(-8)}`);
        setMvcIssueDate(new Date().toISOString().split('T')[0]);
        setMvcValidUntil("2026-12-31");
        setMvcStatus("CLEAR");
      }, 1500);
    }
  };

  const handleMecUpload = (file, preview) => {
    setMecFile(file);
    setMecPreview(preview);
    if (file) {
      setMecNo("Extracting...");
      setMecIssueDate("Extracting...");
      setMecValidUntil("Extracting...");
      setMecCo2("Extracting...");
      setMecHc("Extracting...");
      setMecResult("Extracting...");
      setTimeout(() => {
        setMecNo(`MEC-${String(Date.now()).slice(-8)}`);
        setMecIssueDate(new Date().toISOString().split('T')[0]);
        setMecValidUntil("2026-12-31");
        setMecCo2("0.85 g/km");
        setMecHc("0.12 g/km");
        setMecResult("PASS");
      }, 1500);
    }
  };

  const handleProceedToPayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentDone(true);
    }, 2000);
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
    if (step === 1) return mvcFile !== null && mvcNo && mvcNo !== "Extracting...";
    if (step === 2) return paymentDone;
    return false;
  };

  const nextStep = () => {
    if (step < 3 && canNext()) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const finish = () => {
    onComplete?.({ certificateNo, vehicle });
  };

  const Field = ({ label, val }) => (
    <div className="bg-gray-50 rounded-lg p-3">
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <p className="text-sm font-medium text-gray-900">{val || "—"}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Clearance Request</span>
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
                    <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-semibold
                      ${isCompleted ? "bg-white text-[#0059b5]" : ""}
                      ${isActive ? "bg-white text-[#0059b5] ring-4 ring-white/30" : ""}
                      ${!isCompleted && !isActive ? "bg-white/20 text-white" : ""}`}>
                      {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx}
                    </div>
                    <p className={`text-xs mt-2 ${isActive ? "text-white font-medium" : "text-white/50"}`}>{s}</p>
                    {i < STEPS.length - 1 && (
                      <div className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 ${isCompleted ? "bg-white" : "bg-white/30"}`}
                        style={{ width: "calc(100% - 2rem)", left: "calc(50% + 1rem)" }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Upload size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">MVC</h3>
                </div>
                <FileUpload label="Upload Motor Vehicle Clearance" accept="image/*,application/pdf" onFile={handleMvcUpload} preview={mvcPreview} />
                <div className="mt-4 space-y-3">
                  <Input label="MVC Number" value={mvcNo} onChange={(e) => setMvcNo(e.target.value)} placeholder="Auto-extracted from MVC" />
                  <Input label="Issue Date" value={mvcIssueDate} onChange={(e) => setMvcIssueDate(e.target.value)} placeholder="Auto-extracted from MVC" />
                  <Input label="Valid Until" value={mvcValidUntil} onChange={(e) => setMvcValidUntil(e.target.value)} placeholder="Auto-extracted from MVC" />
                  <Input label="Status" value={mvcStatus} onChange={(e) => setMvcStatus(e.target.value)} placeholder="Auto-extracted from MVC" />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Upload size={18} className="text-[#0059b5]" />
                  <h3 className="text-base font-bold text-gray-900">MEC</h3>
                </div>
                <FileUpload label="Upload Motor Vehicle Emission" accept="image/*,application/pdf" onFile={handleMecUpload} preview={mecPreview} />
                <div className="mt-4 space-y-3">
                  <Input label="MEC Number" value={mecNo} onChange={(e) => setMecNo(e.target.value)} placeholder="Auto-extracted from MEC" />
                  <Input label="Issue Date" value={mecIssueDate} onChange={(e) => setMecIssueDate(e.target.value)} placeholder="Auto-extracted from MEC" />
                  <Input label="Valid Until" value={mecValidUntil} onChange={(e) => setMecValidUntil(e.target.value)} placeholder="Auto-extracted from MEC" />
                  <Input label="CO2" value={mecCo2} onChange={(e) => setMecCo2(e.target.value)} placeholder="Auto-extracted from MEC" />
                  <Input label="HC" value={mecHc} onChange={(e) => setMecHc(e.target.value)} placeholder="Auto-extracted from MEC" />
                  <Input label="Result" value={mecResult} onChange={(e) => setMecResult(e.target.value)} placeholder="Auto-extracted from MEC" />
                </div>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Payment</h3>
              </div>
              <div className="bg-gray-50 rounded-lg p-5 mb-5 text-center">
                <p className="text-sm text-gray-500 mb-1">Clearance Request Fee</p>
                <p className="text-3xl font-bold text-gray-900">PHP 300.00</p>
              </div>
              {processingPayment ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Processing payment...</p>
                </div>
              ) : paymentDone ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle size={24} className="text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Payment Completed</p>
                  <p className="text-xs text-green-600 mt-1">Your payment has been processed successfully.</p>
                </div>
              ) : (
                <Button onClick={handleProceedToPayment} className="w-full">
                  <CreditCard size={16} /> Proceed to Payment
                </Button>
              )}
            </Card>
          )}

          {step === 3 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <FileText size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Issue Clearance Certificate</h3>
              </div>
              {isIssuing && (
                <div className="text-center py-8">
                  <Spinner size="lg" />
                  <p className="text-sm text-gray-500 mt-4">Issuing certificate...</p>
                </div>
              )}
              {certificateNo && !isIssuing && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 text-lg">Clearance Certificate Issued</p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">{certificateNo}</p>
                  <p className="text-xs text-gray-500 mt-1">Plate: {vehicle.plateNumber}</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button onClick={handleDownload} variant="outline"><Download size={16} /> Download</Button>
                    <Button onClick={finish}><CheckCircle size={16} /> Complete</Button>
                  </div>
                </div>
              )}
              {!certificateNo && !isIssuing && (
                <div className="text-center py-6">
                  <p className="text-sm text-gray-500 mb-4">Ready to issue the clearance certificate</p>
                  <Button onClick={handleIssueCertificate}><FileText size={16} /> Issue Certificate</Button>
                </div>
              )}
            </Card>
          )}

          <div className="flex justify-between mt-6">
            <div>
              {step > 1 ? (
                <Button variant="secondary" onClick={prevStep}><ChevronLeft size={16} /> Previous</Button>
              ) : (
                <Button variant="ghost" onClick={onCancel}><X size={16} /> Cancel</Button>
              )}
            </div>
            {step < 3 ? (
              <Button onClick={nextStep} disabled={!canNext()}>Next <ChevronRight size={16} /></Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
