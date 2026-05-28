// constants/statusConfig.js
export const statusConfig = {
  // Existing statuses
  Active: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  Pending: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  Inactive: {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    dot: "bg-slate-400",
  },
  Declined: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },
  Deactivated: {
    bg: "bg-orange-500/15",
    text: "text-orange-400",
    dot: "bg-orange-400",
  },
  APPROVED: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  },
  PENDING: {
    bg: "bg-amber-500/15",
    text: "text-amber-400",
    dot: "bg-amber-400",
  },
  REJECTED: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" },

  // Transaction statuses (matching your sample)
  Authenticated: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  }, // Green
  Verified: {
    bg: "bg-emerald-500/15",
    text: "text-emerald-400",
    dot: "bg-emerald-400",
  }, // Green
  Failed: { bg: "bg-red-500/15", text: "text-red-400", dot: "bg-red-400" }, // Red

  // Default fallback
  default: {
    bg: "bg-slate-500/15",
    text: "text-slate-400",
    dot: "bg-slate-400",
  },
};
