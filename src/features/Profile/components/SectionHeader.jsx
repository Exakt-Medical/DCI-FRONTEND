export const SectionHeader = ({ icon: Icon, title }) => (
  <div className="px-6 py-4 border-b border-gray-200">
    <div className="flex items-center gap-2">
      <div className="w-1 h-5 bg-primary-500 rounded-full"></div>
      <h3 className="font-semibold text-gray-900">{title}</h3>
    </div>
  </div>
);
