import { useState } from "react";
import { RegistrationHeader } from "./registration/components/RegistrationHeader";
import { RegistrationProgress } from "./registration/components/RegistrationProgress";
import { CompanyStep } from "./registration/components/CompanyStep";
import { ProfileStep } from "./registration/components/ProfileStep";
import { ConfirmStep } from "./registration/components/ConfirmStep";
import { SuccessState } from "./registration/components/SuccessState";
import { CameraModal } from "./registration/components/CameraModal";

export const RegistrationWizard = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState(1);
  const [showCamera, setShowCamera] = useState(false);
  const [company, setCompany] = useState({
    name: "",
    code: "",
    branch: "",
    provider: "LTO",
    address: "",
    logo: null,
    logoPreview: null,
    accreditation: null,
    accreditationName: "",
  });
  const [profile, setProfile] = useState({
    avatar: null,
    avatarPreview: null,
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    mobile: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNum, setRefNum] = useState("");

  const steps = ["Company", "Profile", "Confirm"];
  const step1Valid =
    company.name && company.code && company.branch && company.address;
  const step2Valid =
    profile.firstName && profile.lastName && profile.email && profile.mobile;

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSubmitting(false);
    setRefNum("VVIP-" + Math.floor(100000 + Math.random() * 900000));
    setSubmitted(true);
    onComplete?.({ company, profile });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <RegistrationHeader />
        <RegistrationProgress step={step} steps={steps} />

        <div className="bg-white rounded-b-xl shadow-lg p-6">
          {!submitted ? (
            <>
              {step === 1 && (
                <CompanyStep
                  company={company}
                  setCompany={setCompany}
                  onNext={() => setStep(2)}
                  isValid={step1Valid}
                />
              )}
              {step === 2 && (
                <ProfileStep
                  profile={profile}
                  setProfile={setProfile}
                  onBack={() => setStep(1)}
                  onNext={() => setStep(3)}
                  isValid={step2Valid}
                  onOpenCamera={() => setShowCamera(true)}
                />
              )}
              {step === 3 && (
                <ConfirmStep
                  company={company}
                  profile={profile}
                  onBack={() => setStep(2)}
                  onSubmit={handleSubmit}
                  isSubmitting={submitting}
                />
              )}
            </>
          ) : (
            <SuccessState refNum={refNum} />
          )}
        </div>
      </div>

      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={(file, preview) => {
          setProfile({ ...profile, avatar: file, avatarPreview: preview });
        }}
      />
    </div>
  );
};
