import { Send, Users, History } from "lucide-react";

const TabNavigation = ({ activeTab, setActiveTab, agentsCount }) => {
  const tabs = [
    { id: "transfer", label: "Transfer Vouchers", icon: Send },
    { id: "agents", label: "Agents", icon: Users, badge: agentsCount },
    { id: "history", label: "Transfer History", icon: History },
  ];

  return (
    <div className="flex gap-2 mb-6 border-b border-gray-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-6 py-2.5 text-sm font-medium transition-all relative ${
            activeTab === tab.id
              ? "text-primary-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <tab.icon size={14} className="inline mr-2" />
          {tab.label}
          {tab.badge !== undefined && (
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tab.badge}
            </span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
