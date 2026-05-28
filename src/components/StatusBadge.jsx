import { cn } from "../utils/cn";
import { statusConfig } from "../constants/statusConfig";

export const StatusBadge = ({ status }) => {
  const cfg = statusConfig[status] || statusConfig.Inactive;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold",
        cfg.bg,
        cfg.text,
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {status}
    </span>
  );
};
