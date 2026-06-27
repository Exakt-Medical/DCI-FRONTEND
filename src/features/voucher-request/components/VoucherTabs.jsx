import { CreditCard, Package } from "lucide-react";

const TABS = [
  { id: "buy", label: "Buy", icon: CreditCard },
  { id: "inventory", label: "My Transaction Credits", icon: Package },
];

export const VoucherTabs = ({ activeTab, onChange }) => {
  return (
    <div className="bg-white rounded-2xl p-2 border border-gray-200 inline-flex gap-2">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={[
              "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              isActive
                ? "bg-[#0059b5] text-white shadow"
                : "text-gray-600 hover:bg-gray-100",
            ].join(" ")}
          >
            <Icon size={16} /> {tab.label}
          </button>
        );
      })}
    </div>
  );
};
