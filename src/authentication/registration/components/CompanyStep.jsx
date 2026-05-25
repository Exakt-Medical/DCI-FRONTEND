import { Building2, Hash, MapPin, Globe, ArrowRight } from "lucide-react";
import { FileUpload } from "../../../components/FileUpload";

export const CompanyStep = ({ company, setCompany, onNext, isValid }) => {
  return (
    <>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
          <Building2 className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Company Details</h2>
          <p className="text-sm text-gray-500">
            Enter your insurance company information
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            Company Name <span className="text-red-500">*</span>
          </label>
          <div className="relative mt-1">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={company.name}
              onChange={(e) => setCompany({ ...company, name: e.target.value })}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Premier Insurance Corp"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Company Code <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={company.code}
                onChange={(e) =>
                  setCompany({ ...company, code: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="PIC-001"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={company.branch}
                onChange={(e) =>
                  setCompany({ ...company, branch: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Main Branch"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Provider <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={company.provider}
                onChange={(e) =>
                  setCompany({ ...company, provider: e.target.value })
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="LTO">LTO</option>
                <option value="IC">Insurance Commission</option>
                <option value="BSP">BSP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
              Address <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={company.address}
                onChange={(e) =>
                  setCompany({ ...company, address: e.target.value })
                }
                rows={2}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                placeholder="Complete business address"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FileUpload
            label="Company Logo"
            accept="image/*"
            hint="PNG, JPG, SVG"
            onFile={(f, url) =>
              setCompany({ ...company, logo: f, logoPreview: url })
            }
            preview={company.logoPreview}
          />
          <FileUpload
            label="Accreditation"
            accept=".pdf,image/*"
            hint="PDF or Image"
            onFile={(f) =>
              setCompany({
                ...company,
                accreditation: f,
                accreditationName: f?.name,
              })
            }
          />
        </div>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t">
        <button
          onClick={onNext}
          disabled={!isValid}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next <ArrowRight className="w-4 h-4 ml-2" />
        </button>
      </div>
    </>
  );
};
