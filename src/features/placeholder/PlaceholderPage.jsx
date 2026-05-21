export const PlaceholderPage = ({ title, icon, description }) => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-4xl border border-gray-200 dark:border-gray-700">
      {icon}
    </div>
    <h2 className="text-xl font-black text-gray-900 dark:text-white">{title}</h2>
    <p className="text-sm text-gray-500 dark:text-slate-500 text-center max-w-sm">{description}</p>
    <div className="mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-slate-500">
      Module under development
    </div>
  </div>
);