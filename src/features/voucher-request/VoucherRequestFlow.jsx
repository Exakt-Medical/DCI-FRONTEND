import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { FileUpload } from "../../components/FileUpload";
import { useAuth } from "../../context/AuthContext";
import { useRequest } from "../../context/RequestContext";
import DCI_LOGO from "../../assets/DCI-LOGO.png";
import {
  CreditCard, Ticket, Upload, CheckCircle,
  ChevronLeft, ChevronRight, X, AlertTriangle
} from "lucide-react";

const STEPS = ["Vehicle Info", "Payment", "Voucher"];

const emptyVehicle = {
  plateNumber: "", mvFileNumber: "", engineNumber: "", chassisNumber: "",
  make: "", series: "", yearModel: "", color: "", ownerName: "", ownerAddress: "",
};

const makeRequestId = () => `REQ-${Date.now()}-${String(Math.random()).slice(2, 6)}`;

export const VoucherRequestFlow = () => {
  const { role } = useAuth();
  const { handleVoucherRequestComplete, handleRequestSave } = useRequest();
  const navigate = useNavigate();
  const location = useLocation();
  const initialRequest = location.state?.request || null;
  
  const isAgent = role === "agent_fixer";
  const [step, setStep] = useState(1);
  const [orFile, setOrFile] = useState(null);
  const [orPreview, setOrPreview] = useState(null);
  const [orNumber, setOrNumber] = useState("");
  const [orDate, setOrDate] = useState("");
  const [orAmount, setOrAmount] = useState("");
  const [orCr, setOrCr] = useState(emptyVehicle);
  const [crFile, setCrFile] = useState(null);
  const [crPreview, setCrPreview] = useState(null);
  const [crNumber, setCrNumber] = useState("");
  const [crCr, setCrCr] = useState(emptyVehicle);
  const [paymentDone, setPaymentDone] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherAssigned, setVoucherAssigned] = useState(false);
  const [batchRows, setBatchRows] = useState(() => {
    if (!isAgent) return [];
    if (initialRequest?.requestId) {
      return [initialRequest];
    }
    return [];
  });

  const updateOrCr = (field, value) => setOrCr((p) => ({ ...p, [field]: value }));
  const updateCrCr = (field, value) => setCrCr((p) => ({ ...p, [field]: value }));

  const plateMismatch = orCr.plateNumber && crCr.plateNumber && orCr.plateNumber !== crCr.plateNumber;

  const clearEntryForm = () => {
    setOrFile(null);
    setOrPreview(null);
    setOrNumber("");
    setOrDate("");
    setOrAmount("");
    setOrCr(emptyVehicle);
    setCrFile(null);
    setCrPreview(null);
    setCrNumber("");
    setCrCr(emptyVehicle);
  };

  const buildDraftRecord = (requestId) => ({
    requestId,
    role,
    dateCreated: new Date().toISOString().split("T")[0],
    currentStep: 1,
    status: "DRAFT",
    voucherStatus: "DRAFT",
    clearanceStatus: "",
    plateNumber: orCr.plateNumber || crCr.plateNumber || "",
    orNumber,
    orDate,
    orAmount,
    crNumber,
    orCr,
    crCr,
    orPreview,
    crPreview,
  });

  const handleOrUpload = (file, preview) => {
    setOrFile(file);
    setOrPreview(preview);
    if (file) {
      setOrNumber("Extracting...");
      setOrDate("Extracting...");
      setOrAmount("Extracting...");
      updateOrCr("plateNumber", "Extracting...");
      setTimeout(() => {
        setOrNumber(`OR-${String(Date.now()).slice(-8)}`);
        setOrDate(new Date().toISOString().split('T')[0]);
        setOrAmount("PHP 100.00");
        updateOrCr("plateNumber", orCr.plateNumber && orCr.plateNumber !== "Extracting..." ? orCr.plateNumber : "ABC1234");
        updateOrCr("mvFileNumber", "13242500000003A");
        updateOrCr("engineNumber", "ENG-" + String(Math.random()).slice(2, 8));
        updateOrCr("chassisNumber", "CHA-" + String(Math.random()).slice(2, 8));
        updateOrCr("make", "TOYOTA");
        updateOrCr("series", "VIOS");
        updateOrCr("yearModel", "2020");
        updateOrCr("color", "WHITE");
        updateOrCr("ownerName", "JUAN DELA CRUZ");
        updateOrCr("ownerAddress", "123 Rizal St., Manila");
      }, 1500);
    }
  };

  const handleCrUpload = (file, preview) => {
    setCrFile(file);
    setCrPreview(preview);
    if (file) {
      setCrNumber("Extracting...");
      updateCrCr("plateNumber", "Extracting...");
      setTimeout(() => {
        setCrNumber(`CR-${String(Date.now()).slice(-8)}`);
        updateCrCr("plateNumber", crCr.plateNumber && crCr.plateNumber !== "Extracting..." ? crCr.plateNumber : "ABC1234");
        updateCrCr("mvFileNumber", "13242500000003A");
        updateCrCr("engineNumber", "ENG-" + String(Math.random()).slice(2, 8));
        updateCrCr("chassisNumber", "CHA-" + String(Math.random()).slice(2, 8));
        updateCrCr("make", "TOYOTA");
        updateCrCr("series", "VIOS");
        updateCrCr("yearModel", "2020");
        updateCrCr("color", "WHITE");
        updateCrCr("ownerName", "JUAN DELA CRUZ");
        updateCrCr("ownerAddress", "123 Rizal St., Manila");
      }, 1500);
    }
  };

  const handleProceedToPayment = () => {
    setProcessingPayment(true);
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentDone(true);
      if (isAgent) {
        const now = new Date().toISOString().split("T")[0];
        const issued = batchRows.map((row, idx) => {
          const code = `VCH-${String(Date.now() + idx).slice(-8)}`;
          const updated = {
            ...row,
            currentStep: 3,
            dateCreated: row.dateCreated || now,
            status: "VOUCHER_ISSUED",
            voucherStatus: "VOUCHER_ISSUED",
            voucherReferenceNo: code,
            voucherCode: code,
            paymentDone: true,
            voucherAssigned: true,
          };
          handleRequestSave(updated);
          return updated;
        });
        setBatchRows(issued);
        setVoucherAssigned(issued.length > 0);
      } else {
        const code = "VCH-" + String(Date.now()).slice(-8);
        setVoucherCode(code);
        setVoucherAssigned(true);
      }
    }, 2000);
  };

  const handleAddToBatch = () => {
    if (!isAgent) return;
    const orOk = orCr.plateNumber && orCr.ownerName && orCr.plateNumber !== "Extracting...";
    const crOk = crCr.plateNumber && crCr.ownerName && crCr.plateNumber !== "Extracting...";
    const match = orCr.plateNumber === crCr.plateNumber;
    if (!(orOk && crOk && match)) return;

    const requestId = makeRequestId();
    const draft = buildDraftRecord(requestId);
    handleRequestSave(draft);
    setBatchRows((prev) => [draft, ...prev]);
    clearEntryForm();
  };

  const canNext = () => {
    if (step === 1) {
      if (isAgent) return batchRows.length > 0;
      const orOk = orCr.plateNumber && orCr.ownerName && orCr.plateNumber !== "Extracting...";
      const crOk = crCr.plateNumber && crCr.ownerName && crCr.plateNumber !== "Extracting...";
      const match = orCr.plateNumber === crCr.plateNumber;
      return orOk && crOk && match;
    }
    if (step === 2) return voucherAssigned;
    if (step === 3) return voucherAssigned;
    return false;
  };

  const nextStep = () => {
    if (step < 3 && canNext()) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const finish = () => {
    if (isAgent) {
      handleVoucherRequestComplete({ rows: batchRows });
      navigate("/dci-access/requests");
      return;
    }

    const requestId = initialRequest?.requestId || makeRequestId();
    const record = {
      requestId,
      role,
      dateCreated: initialRequest?.dateCreated || new Date().toISOString().split("T")[0],
      currentStep: 3,
      status: "VOUCHER_ISSUED",
      voucherStatus: "VOUCHER_ISSUED",
      voucherReferenceNo: voucherCode,
      voucherCode,
      paymentDone,
      voucherAssigned,
      plateNumber: orCr.plateNumber || crCr.plateNumber || "",
      orNumber,
      orDate,
      orAmount,
      crNumber,
      orCr,
      crCr,
      orPreview,
      crPreview,
    };
    handleRequestSave(record);
    handleVoucherRequestComplete(record);
    navigate("/dci-access/requests");
  };

  const onCancel = () => {
    navigate("/dci-access/requests");
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
        <textarea value={values.ownerAddress} onChange={(e) => onChange("ownerAddress", e.target.value)}
          placeholder="Auto-extracted" rows={3}
          className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="bg-white rounded-t-xl shadow-lg overflow-hidden">
          <div className="p-4 flex items-center gap-3 border-b border-gray-200">
            <img src={DCI_LOGO} alt="DCI" className="h-10" />
            <span className="font-bold text-gray-900">Voucher Request</span>
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
                  <p className="text-sm text-red-700">
                    Plate number mismatch: OR says <strong>{orCr.plateNumber}</strong>, CR says <strong>{crCr.plateNumber}</strong>. Both must match to proceed.
                  </p>
                </div>
              )}

              {isAgent && (
                <Card className="mt-4 p-4 border border-blue-100 bg-blue-50/40">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Bulk Staging</p>
                      <p className="text-xs text-gray-600">Add each OR/CR pair to the queue before paying once.</p>
                    </div>
                    <Button onClick={handleAddToBatch} disabled={!orCr.plateNumber || !crCr.plateNumber || plateMismatch}>
                      Add To Batch
                    </Button>
                  </div>
                  {batchRows.length === 0 ? (
                    <p className="text-sm text-gray-500">No staged entries yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-blue-100 text-left">
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Owner</th>
                            <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchRows.map((row) => (
                            <tr key={row.requestId} className="border-b border-blue-50">
                              <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                              <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                              <td className="py-2 text-gray-700">{row.orCr?.ownerName || row.crCr?.ownerName || "-"}</td>
                              <td className="py-2 text-gray-600">{row.voucherStatus || "DRAFT"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
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
                <p className="text-sm text-gray-500 mb-1">Voucher Request Fee</p>
                <p className="text-3xl font-bold text-gray-900">
                  {isAgent ? `PHP ${(batchRows.length * 100).toFixed(2)}` : "PHP 100.00"}
                </p>
                {isAgent && (
                  <p className="text-xs text-gray-500 mt-1">{batchRows.length} request{batchRows.length !== 1 ? "s" : ""} in this batch</p>
                )}
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
                <Ticket size={18} className="text-[#0059b5]" />
                <h3 className="text-base font-bold text-gray-900">Voucher Issued</h3>
              </div>
              {isAgent ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="font-semibold text-green-700 mb-3">{batchRows.length} voucher request{batchRows.length !== 1 ? "s" : ""} issued</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-green-200 text-left">
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Request ID</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Plate</th>
                          <th className="pb-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">Voucher Ref</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchRows.map((row) => (
                          <tr key={row.requestId} className="border-b border-green-100">
                            <td className="py-2 font-mono text-xs text-gray-700">{row.requestId}</td>
                            <td className="py-2 text-gray-700">{row.plateNumber || "-"}</td>
                            <td className="py-2 font-mono text-xs font-semibold text-gray-900">{row.voucherReferenceNo || row.voucherCode || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle size={40} className="text-green-600 mx-auto mb-3" />
                  <p className="font-semibold text-green-700 text-lg">Voucher Issued</p>
                  <p className="text-sm font-mono font-bold text-gray-900 mt-2">{voucherCode}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Plate: {orCr.plateNumber}
                  </p>
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
            ) : voucherAssigned ? (
              <Button onClick={finish}><CheckCircle size={16} /> Complete</Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};