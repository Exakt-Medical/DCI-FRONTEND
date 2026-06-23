import { cn } from "../utils/cn";

export const Input = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  icon,
  className,
  error,
}) => (
  <div className={cn("flex flex-col gap-1.5", className)}>
    {label && (
      <label className={cn("text-xs font-semibold text-gray-600 uppercase tracking-wider", error && "text-red-500")}>
        {label}
        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>
    )}

    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
          {icon}
        </span>
      )}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          "w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400",
          error ? "border-red-500 ring-2 ring-red-100 focus:border-red-500 focus:ring-red-100" : "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
          "transition-all",
          icon && "pl-9"
        )}
      />
    </div>
  </div>
);