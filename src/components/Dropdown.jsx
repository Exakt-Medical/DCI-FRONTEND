import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export const Dropdown = ({
  options, // Array of { value, label } or just strings
  value, // Currently selected value
  onChange, // Function called when selection changes
  placeholder = "Select an option",
  className = "",
  buttonClassName = "",
  menuClassName = "",
  showCheckmark = true,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Convert options to consistent format
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { value: opt, label: opt } : opt,
  );

  // Find selected label
  const selectedOption = normalizedOptions.find((opt) => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  const handleSelect = (selectedValue) => {
    onChange(selectedValue);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`inline-flex items-center justify-between gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors ${
          disabled ? "opacity-50 cursor-not-allowed" : ""
        } ${buttonClassName}`}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className={`absolute left-0 z-10 mt-1 min-w-[160px] origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black/5 py-1 ${menuClassName}`}
        >
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className={`flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                value === option.value ? "text-primary-600" : "text-gray-700"
              }`}
            >
              {option.label}
              {showCheckmark && value === option.value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
