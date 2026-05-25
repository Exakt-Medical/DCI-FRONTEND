export const TicketTabs = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: "all", label: "All", count: counts.all },
    { id: "Data Mismatch", label: "Mismatched", count: counts.dataMismatch },
    {
      id: "Vehicle Not Found",
      label: "Vehicle Not Found",
      count: counts.vehicleNotFound,
    },
  ];

  return (
    <div className="border-b border-gray-200">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tab.count}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
