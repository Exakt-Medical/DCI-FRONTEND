import { cn } from "../utils/cn";

export const Spinner = ({ size = "md", className }) => {
  const s =
    size === "sm"
      ? "w-4 h-4"
      : size === "lg"
      ? "w-10 h-10"
      : "w-6 h-6";

  return (
    <div
      className={cn(
        "border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin",
        s,
        className
      )}
    />
  );
};