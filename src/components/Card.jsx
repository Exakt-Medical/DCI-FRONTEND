import { cn } from "../utils/cn";

export const Card = ({ children, className }) => (
  <div className={cn("bg-white border border-gray-200 rounded-2xl shadow-sm", className)}>
    {children}
  </div>
);