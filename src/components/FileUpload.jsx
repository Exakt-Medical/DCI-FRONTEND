import { useRef } from "react";
import { Upload, Image, X } from "lucide-react";

export const FileUpload = ({
  label,
  accept,
  onFile,
  preview,
  required,
  hint,
}) => {
  const ref = useRef();

  const handleRemove = (e) => {
    e.stopPropagation();
    onFile(null, null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        onClick={() => ref.current.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all group"
      >
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="preview"
              className="w-16 h-16 object-cover rounded-lg"
            />
            <button
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-all">
            <Image size={24} />
          </div>
        )}

        <p className="text-xs text-gray-500 group-hover:text-primary-600 transition-colors">
          {preview ? "Click to change" : "Click to upload"}
        </p>

        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>

      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) {
            const url = URL.createObjectURL(f);
            onFile(f, url);
          }
          e.target.value = ""; // Reset input
        }}
      />
    </div>
  );
};
