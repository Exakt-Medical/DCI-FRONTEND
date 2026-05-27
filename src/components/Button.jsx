import { cn } from "../utils/cn";

export const Button = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled,
  className,
  type = "button",
}) => {
  const variants = {
    primary: "bg-[#0059b5] hover:bg-[#004a97] text-white shadow-md", // Updated to use your color

    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",

    ghost: "hover:bg-gray-100 text-gray-600 hover:text-gray-900",

    danger: "bg-red-100 hover:bg-red-200 text-red-600 border border-red-200",

    success:
      "bg-green-100 hover:bg-green-200 text-green-700 border border-green-200",

    outline:
      "border border-[#0059b5] text-[#0059b5] hover:bg-[#0059b5] hover:text-white", // Also update outline variant
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-xl transition-all duration-200 flex items-center gap-2 justify-center font-medium",
        variants[variant],
        sizes[size],
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
};
