import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Spinner } from "../../components/Spinner";
import {
  User,
  Phone,
  Mail,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Shield,
  Car,
  Camera,
  Building,
  CreditCard,
  Wallet,
  Landmark,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

const PaymentPage = ({ pendingPayment, onSuccess, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  // Personal Details
  const [personalDetails, setPersonalDetails] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    countryOfBirth: "",
    placeOfBirth: "",
    citizenship: "",
  });

  // Contact Details
  const [contactDetails, setContactDetails] = useState({
    mobileNumber: "",
    email: "",
  });

  // Government ID
  const [governmentId, setGovernmentId] = useState({
    idType: "",
    idFile: null,
    idFileName: "",
  });

  // Vehicle Documents
  const [vehicleDocs, setVehicleDocs] = useState({
    officialReceipt: null,
    officialReceiptName: "",
    certificateOfRegistration: null,
    certificateOfRegistrationName: "",
  });

  // Car Ownership
  const [isOwnName, setIsOwnName] = useState(null);
  const [deedOfSale, setDeedOfSale] = useState({
    file: null,
    fileName: "",
  });

  // Vehicle Photos
  const [vehiclePhotos, setVehiclePhotos] = useState({
    front: null,
    frontName: "",
    rear: null,
    rearName: "",
  });

  // Terms
  const [terms, setTerms] = useState({
    authorizeProcessing: false,
    agreeTerms: false,
    authorizeEvaluation: false,
  });

  // Drag and drop states
  const [dragActive, setDragActive] = useState({});

  // Pre-fill form with data from pendingPayment
  useEffect(() => {
    if (pendingPayment) {
      const { formData } = pendingPayment;
      if (formData?.personalDetails) {
        setPersonalDetails((prev) => ({
          ...prev,
          firstName: formData.personalDetails.firstName || "",
          lastName: formData.personalDetails.lastName || "",
        }));
      }
      if (formData?.contactDetails) {
        setContactDetails({
          mobileNumber: formData.contactDetails.mobileNumber || "",
          email: formData.contactDetails.email || "",
        });
      }
    }
  }, [pendingPayment]);

  const handlePersonalChange = (field, value) => {
    setPersonalDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactChange = (field, value) => {
    setContactDetails((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (type, file) => {
    if (type === "governmentId") {
      setGovernmentId({
        ...governmentId,
        idFile: file,
        idFileName: file.name,
      });
    } else if (type === "officialReceipt") {
      setVehicleDocs({
        ...vehicleDocs,
        officialReceipt: file,
        officialReceiptName: file.name,
      });
    } else if (type === "certificateOfRegistration") {
      setVehicleDocs({
        ...vehicleDocs,
        certificateOfRegistration: file,
        certificateOfRegistrationName: file.name,
      });
    } else if (type === "deedOfSale") {
      setDeedOfSale({
        file: file,
        fileName: file.name,
      });
    } else if (type === "frontPhoto") {
      setVehiclePhotos({
        ...vehiclePhotos,
        front: file,
        frontName: file.name,
      });
    } else if (type === "rearPhoto") {
      setVehiclePhotos({
        ...vehiclePhotos,
        rear: file,
        rearName: file.name,
      });
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive((prev) => ({ ...prev, [type]: true }));
    } else if (e.type === "dragleave") {
      setDragActive((prev) => ({ ...prev, [type]: false }));
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive((prev) => ({ ...prev, [type]: false }));

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileUpload(type, files[0]);
    }
  };

  const handleFileSelect = (e, type) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(type, files[0]);
    }
  };

  const isStep1Complete = () => {
    return (
      personalDetails.firstName &&
      personalDetails.lastName &&
      personalDetails.birthDate &&
      personalDetails.gender &&
      personalDetails.countryOfBirth &&
      personalDetails.placeOfBirth &&
      personalDetails.citizenship &&
      contactDetails.mobileNumber &&
      contactDetails.email
    );
  };

  const isStep2Complete = () => {
    return (
      governmentId.idType &&
      governmentId.idFile &&
      vehicleDocs.officialReceipt &&
      vehicleDocs.certificateOfRegistration &&
      vehiclePhotos.front &&
      vehiclePhotos.rear &&
      isOwnName !== null &&
      (isOwnName === true || (isOwnName === false && deedOfSale.file))
    );
  };

  const isStep3Complete = () => {
    return (
      terms.authorizeProcessing &&
      terms.agreeTerms &&
      terms.authorizeEvaluation &&
      selectedPaymentMethod
    );
  };

  const nextStep = () => {
    if (currentStep === 1 && isStep1Complete()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Complete()) {
      setCurrentStep(3);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isStep3Complete()) return;

    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowSuccessModal(true);

    // Save pending purchase completion
    if (pendingPayment) {
      localStorage.setItem(
        "ctpl_pending_purchase",
        JSON.stringify({
          ...pendingPayment,
          completed: true,
          paymentMethod: selectedPaymentMethod,
        }),
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    // Pass the product and quantity to onSuccess
    if (onSuccess && pendingPayment) {
      const quantity = pendingPayment.formData?.quantity || 1;
      onSuccess(pendingPayment.product, quantity);
    } else if (onSuccess) {
      onSuccess();
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);
  };

  const premiumBreakdown = {
    basicPremium: 447.11,
    documentaryStamps: 55.89,
    vat: 53.65,
    localGovTax: 0.89,
    dciFee: 60.0,
    cocvf: 32.96,
    bayadCenterFee: 9.5,
  };

  const totalPremium = Object.values(premiumBreakdown).reduce(
    (a, b) => a + b,
    0,
  );

  const UploadComponent = ({
    label,
    type,
    accept = "image/*,.pdf",
    exampleText = "Example: driver_license_front.jpg",
  }) => (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          dragActive[type]
            ? "border-primary-500 bg-primary-50"
            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
        }`}
        onDragEnter={(e) => handleDrag(e, type)}
        onDragLeave={(e) => handleDrag(e, type)}
        onDragOver={(e) => handleDrag(e, type)}
        onDrop={(e) => handleDrop(e, type)}
      >
        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 mb-1">
          Drag & drop or{" "}
          <span className="text-primary-600 cursor-pointer">
            click to upload
          </span>
        </p>
        <input
          type="file"
          className="hidden"
          id={`upload-${type}`}
          accept={accept}
          onChange={(e) => handleFileSelect(e, type)}
        />
        <button
          type="button"
          onClick={() => document.getElementById(`upload-${type}`).click()}
          className="text-xs text-gray-500 underline"
        >
          Browse files
        </button>
        <p className="text-xs text-gray-400 mt-2">{exampleText}</p>
      </div>
      {type === "governmentId" && governmentId.idFileName && (
        <p className="text-xs text-green-600">✓ {governmentId.idFileName}</p>
      )}
      {type === "officialReceipt" && vehicleDocs.officialReceiptName && (
        <p className="text-xs text-green-600">
          ✓ {vehicleDocs.officialReceiptName}
        </p>
      )}
      {type === "certificateOfRegistration" &&
        vehicleDocs.certificateOfRegistrationName && (
          <p className="text-xs text-green-600">
            ✓ {vehicleDocs.certificateOfRegistrationName}
          </p>
        )}
      {type === "deedOfSale" && deedOfSale.fileName && (
        <p className="text-xs text-green-600">✓ {deedOfSale.fileName}</p>
      )}
      {type === "frontPhoto" && vehiclePhotos.frontName && (
        <p className="text-xs text-green-600">✓ {vehiclePhotos.frontName}</p>
      )}
      {type === "rearPhoto" && vehiclePhotos.rearName && (
        <p className="text-xs text-green-600">✓ {vehiclePhotos.rearName}</p>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Purchase CTPL Insurance
        </h1>
        <p className="text-sm text-gray-500">
          Complete the 3-step process to purchase your insurance
        </p>
      </div>

      {/* Cancel Button */}
      <div className="mb-4">
        <Button variant="secondary" onClick={onCancel} size="sm">
          ← Back to Vouchers
        </Button>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 1
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              1
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                currentStep >= 2 ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 2
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              2
            </div>
            <div
              className={`flex-1 h-1 mx-2 ${
                currentStep >= 3 ? "bg-primary-600" : "bg-gray-200"
              }`}
            />
          </div>
          <div className="flex-1 flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                currentStep >= 3
                  ? "bg-primary-600 text-white"
                  : "bg-gray-200 text-gray-500"
              }`}
            >
              3
            </div>
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span className="flex-1 text-center">Personal & Contact Info</span>
          <span className="flex-1 text-center">
            Documents & Vehicle Details
          </span>
          <span className="flex-1 text-center">Payment & Consent</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          {/* Step 1: Personal & Contact Details */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <User size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Personal Details
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="First Name"
                    value={personalDetails.firstName}
                    onChange={(e) =>
                      handlePersonalChange("firstName", e.target.value)
                    }
                    placeholder="Juan"
                    required
                  />
                  <Input
                    label="Middle Name"
                    value={personalDetails.middleName}
                    onChange={(e) =>
                      handlePersonalChange("middleName", e.target.value)
                    }
                    placeholder="Santos"
                  />
                  <Input
                    label="Last Name"
                    value={personalDetails.lastName}
                    onChange={(e) =>
                      handlePersonalChange("lastName", e.target.value)
                    }
                    placeholder="Cruz"
                    required
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Birth Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={personalDetails.birthDate}
                      onChange={(e) =>
                        handlePersonalChange("birthDate", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="Male"
                          checked={personalDetails.gender === "Male"}
                          onChange={(e) =>
                            handlePersonalChange("gender", e.target.value)
                          }
                          className="text-primary-600"
                        />
                        <span className="text-sm">Male</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="gender"
                          value="Female"
                          checked={personalDetails.gender === "Female"}
                          onChange={(e) =>
                            handlePersonalChange("gender", e.target.value)
                          }
                          className="text-primary-600"
                        />
                        <span className="text-sm">Female</span>
                      </label>
                    </div>
                  </div>

                  {/* Country of Birth - Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Country of Birth <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={personalDetails.countryOfBirth}
                      onChange={(e) =>
                        handlePersonalChange("countryOfBirth", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="Philippines">Philippines</option>
                      <option value="Afghanistan">Afghanistan</option>
                    </select>
                  </div>

                  {/* Place of Birth - Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Place of Birth <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={personalDetails.placeOfBirth}
                      onChange={(e) =>
                        handlePersonalChange("placeOfBirth", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select City/Municipality</option>
                      <option value="Manila">Manila</option>
                      <option value="Quezon City">Quezon City</option>
                      <option value="Caloocan">Caloocan</option>
                    </select>
                  </div>

                  {/* Citizenship - Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Citizenship / Nationality{" "}
                      <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={personalDetails.citizenship}
                      onChange={(e) =>
                        handlePersonalChange("citizenship", e.target.value)
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select Citizenship</option>
                      <option value="Filipino">Filipino</option>
                      <option value="Dual Citizenship">Dual Citizenship</option>
                      <option value="American">American</option>
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Phone size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Contact Details
                  </h3>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-700">
                    🔐 Log in to your account to autofill verified personal
                    information and skip verification steps.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mobile Number"
                    value={contactDetails.mobileNumber}
                    onChange={(e) =>
                      handleContactChange("mobileNumber", e.target.value)
                    }
                    placeholder="09171234567"
                    required
                  />
                  <Input
                    label="Personal Email Address"
                    type="email"
                    value={contactDetails.email}
                    onChange={(e) =>
                      handleContactChange("email", e.target.value)
                    }
                    placeholder="juan.cruz@email.com"
                    required
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Step 2: Documents & Vehicle Details */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <FileText size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Government ID
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      ID Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={governmentId.idType}
                      onChange={(e) =>
                        setGovernmentId({
                          ...governmentId,
                          idType: e.target.value,
                        })
                      }
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Select ID Type</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="passport">Passport</option>
                      <option value="umid">UMID</option>
                      <option value="philsys">PhilSys ID</option>
                      <option value="sss">SSS ID</option>
                      <option value="prc">PRC ID</option>
                    </select>
                  </div>
                  <UploadComponent label="ID Data Page" type="governmentId" />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Car size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Required Vehicle Documents
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadComponent
                    label="Official Receipt (OR)"
                    type="officialReceipt"
                  />
                  <UploadComponent
                    label="Certificate of Registration (CR)"
                    type="certificateOfRegistration"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Building size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Car Ownership
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Are the Official Receipt and Certificate of Registration
                      under your name? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="ownership"
                          cc
                          value="yes"
                          checked={isOwnName === true}
                          onChange={() => setIsOwnName(true)}
                          className="text-primary-600"
                        />
                        <span className="text-sm">Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="ownership"
                          value="no"
                          checked={isOwnName === false}
                          onChange={() => setIsOwnName(false)}
                          className="text-primary-600"
                        />
                        <span className="text-sm">No</span>
                      </label>
                    </div>
                  </div>
                  {isOwnName === false && (
                    <UploadComponent
                      label="Absolute Deed of Sale"
                      type="deedOfSale"
                    />
                  )}
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Camera size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Actual Vehicle Photos
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UploadComponent
                    label="Vehicle Front Photo"
                    type="frontPhoto"
                    exampleText="Example: front_view.jpg"
                  />
                  <UploadComponent
                    label="Vehicle Rear Photo"
                    type="rearPhoto"
                    exampleText="Example: rear_view.jpg"
                  />
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Payment & Consent */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <CreditCard size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Select Payment Method
                  </h3>
                </div>
                <div className="space-y-3">
                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === "credit_card"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("credit_card")}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard size={20} className="text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Credit / Debit Card
                        </p>
                        <p className="text-xs text-gray-500">
                          Visa, Mastercard, Amex, JCB
                        </p>
                      </div>
                      {selectedPaymentMethod === "credit_card" && (
                        <CheckCircle
                          size={16}
                          className="text-primary-600 ml-auto"
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === "gcash"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("gcash")}
                  >
                    <div className="flex items-center gap-3">
                      <Wallet size={20} className="text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">GCash</p>
                        <p className="text-xs text-gray-500">
                          Pay using GCash mobile wallet
                        </p>
                      </div>
                      {selectedPaymentMethod === "gcash" && (
                        <CheckCircle
                          size={16}
                          className="text-primary-600 ml-auto"
                        />
                      )}
                    </div>
                  </div>

                  <div
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedPaymentMethod === "bank_transfer"
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => setSelectedPaymentMethod("bank_transfer")}
                  >
                    <div className="flex items-center gap-3">
                      <Landmark size={20} className="text-gray-600" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          Bank Transfer
                        </p>
                        <p className="text-xs text-gray-500">
                          BPI, BDO, Metrobank, UnionBank
                        </p>
                      </div>
                      {selectedPaymentMethod === "bank_transfer" && (
                        <CheckCircle
                          size={16}
                          className="text-primary-600 ml-auto"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <Shield size={18} className="text-primary-600" />
                  <h3 className="text-base font-bold text-gray-900">
                    Terms & Consent
                  </h3>
                </div>
                <div className="space-y-3">
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={terms.authorizeProcessing}
                      onChange={(e) =>
                        setTerms({
                          ...terms,
                          authorizeProcessing: e.target.checked,
                        })
                      }
                      className="mt-0.5 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">
                      I authorize the insurance provider to process and manage
                      my policy.
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={terms.agreeTerms}
                      onChange={(e) =>
                        setTerms({ ...terms, agreeTerms: e.target.checked })
                      }
                      className="mt-0.5 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">
                      I agree to the{" "}
                      <a href="#" className="text-primary-600 hover:underline">
                        Terms & Conditions
                      </a>{" "}
                      and{" "}
                      <a href="#" className="text-primary-600 hover:underline">
                        Privacy Policy
                      </a>
                      .
                    </span>
                  </label>
                  <label className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={terms.authorizeEvaluation}
                      onChange={(e) =>
                        setTerms({
                          ...terms,
                          authorizeEvaluation: e.target.checked,
                        })
                      }
                      className="mt-0.5 text-primary-600"
                    />
                    <span className="text-sm text-gray-700">
                      I authorize the platform and affiliates to evaluate and
                      assess my request.
                    </span>
                  </label>
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-500">
                    By checking these boxes, you confirm that all information
                    provided is accurate and complete. You understand that
                    providing false information may result in policy
                    cancellation or claim denial.
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Premium Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                <CreditCard size={18} className="text-primary-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Premium Summary
                </h3>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Basic Premium</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.basicPremium)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Documentary Stamps</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.documentaryStamps)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">VAT</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.vat)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Local Government Tax</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.localGovTax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">DCI Fee</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.dciFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">COCVF</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.cocvf)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Bayad Center Fee</span>
                  <span className="text-gray-900">
                    {formatCurrency(premiumBreakdown.bayadCenterFee)}
                  </span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-900">Total Premium</span>
                    <span className="text-primary-600 text-lg">
                      {formatCurrency(totalPremium)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-3 mb-4">
                <p className="text-xs text-green-700 text-center">
                  💳 No additional transaction fees
                </p>
              </div>
            </Card>

            <Card className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-green-600" />
                <p className="text-xs font-semibold text-green-700">
                  Secure Payment
                </p>
              </div>
              <p className="text-xs text-gray-500">
                Your payment information is encrypted and secure. We accept all
                major credit cards, GCash, and bank transfers.
              </p>
            </Card>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 mt-6">
        {currentStep > 1 ? (
          <Button
            variant="secondary"
            onClick={prevStep}
            className="flex items-center gap-2"
          >
            <ChevronLeft size={16} /> Previous
          </Button>
        ) : (
          <div />
        )}

        {currentStep < 3 ? (
          <Button
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !isStep1Complete()) ||
              (currentStep === 2 && !isStep2Complete())
            }
            className="flex items-center gap-2"
          >
            Next <ChevronRight size={16} />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!isStep3Complete() || isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? <Spinner size="sm" /> : "Pay Now"}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  Payment Successful!
                </h2>
                <p className="text-xs text-gray-500">
                  Your CTPL insurance application has been submitted
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Reference Number</p>
                <code className="text-sm font-mono font-bold text-gray-900 block">
                  CTPL-{Date.now().toString().slice(-8)}
                </code>
                <p className="text-xs text-gray-500 mt-2">
                  Payment Method:{" "}
                  {selectedPaymentMethod === "credit_card"
                    ? "Credit/Debit Card"
                    : selectedPaymentMethod === "gcash"
                      ? "GCash"
                      : "Bank Transfer"}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>Next Steps:</strong> Our team will review your
                  application within 24-48 hours. You will receive an email with
                  your policy details once approved.
                </p>
              </div>

              <Button onClick={handleSuccessClose} className="w-full">
                View My Policies
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentPage;
