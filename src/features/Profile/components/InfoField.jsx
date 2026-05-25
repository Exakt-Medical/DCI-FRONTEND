import { ChevronDown } from "lucide-react";

export const InfoField = ({
  label,
  name,
  value,
  isEditing,
  type = "text",
  options = null,
  onChange,
}) => {
  if (isEditing) {
    if (options) {
      return (
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">
            {label}
          </label>
          <div className="relative">
            <select
              name={name}
              value={value}
              onChange={onChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              size={16}
            />
          </div>
        </div>
      );
    }
    return (
      <div>
        <label className="text-xs font-medium text-gray-500 block mb-1">
          {label}
        </label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
    );
  }
  return (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">
        {label}
      </label>
      <p className="text-sm text-gray-900">{value || "-"}</p>
    </div>
  );
};
