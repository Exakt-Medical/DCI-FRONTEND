import React from "react";

export default function Switch({
  checked = false,
  onChange = () => {},
  disabled = false,
  id,
  className = "",
  ariaLabel,
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`w-20 relative inline-flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
        checked ? "bg-primary-600" : "bg-gray-200"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      <span
        className={`inline-block w-10 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ${
          checked ? "translate-x-8" : "translate-x-0"
        }`}
      />
    </button>
  );
}
