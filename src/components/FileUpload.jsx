import { useRef } from "react";

export const FileUpload = ({
  label,
  accept,
  onFile,
  preview,
  required,
  hint,
}) => {
  const ref = useRef();

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
        className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all"
      >
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-16 h-16 object-cover rounded-lg"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-xl">
            📁
          </div>
        )}

        <p className="text-xs text-gray-500">
          {preview ? "Click to change" : "Click to upload"}
        </p>

        {hint && (
          <p className="text-xs text-gray-400">{hint}</p>
        )}
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
        }}
      />
    </div>
  );
};