import {
  UserCircle,
  Upload,
  Camera,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "../../../components/Button";

export const ProfileStep = ({
  profile,
  setProfile,
  onBack,
  onNext,
  isValid,
  onOpenCamera,
}) => {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Profile Details</h2>
          <p className="text-sm text-gray-500">Administrator's information</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 overflow-hidden flex items-center justify-center">
          {profile.avatarPreview ? (
            <img
              src={profile.avatarPreview}
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-8 h-8 text-gray-400" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">
            Profile Photo
          </p>
          <div className="flex gap-2">
            <label className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs cursor-pointer hover:bg-gray-200">
              <Upload className="w-3 h-3 inline mr-1" /> Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f)
                    setProfile({
                      ...profile,
                      avatar: f,
                      avatarPreview: URL.createObjectURL(f),
                    });
                }}
              />
            </label>
            <button
              onClick={onOpenCamera}
              className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs hover:bg-gray-200"
            >
              <Camera className="w-3 h-3 inline mr-1" /> Take Photo
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              First Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) =>
                  setProfile({ ...profile, firstName: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                placeholder="First name"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Middle Name
            </label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={profile.middleName}
                onChange={(e) =>
                  setProfile({ ...profile, middleName: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Middle name"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Last Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={profile.lastName}
              onChange={(e) =>
                setProfile({ ...profile, lastName: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={profile.email}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              placeholder="admin@company.com"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Mobile <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={profile.mobile}
              onChange={(e) =>
                setProfile({ ...profile, mobile: e.target.value })
              }
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg"
              placeholder="09XXXXXXXXX"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6 pt-4 border-t">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </>
  );
};
