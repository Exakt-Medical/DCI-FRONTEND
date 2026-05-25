import { ChevronLeft, ChevronRight } from "lucide-react";

export const TicketPagination = ({
  currentPage,
  totalPages,
  startIndex,
  itemsPerPage,
  totalItems,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      for (let i = 1; i <= 5; i++) pages.push(i);
    } else if (currentPage >= totalPages - 2) {
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
      <p className="text-xs text-gray-500">
        Showing {startIndex + 1} to{" "}
        {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems}{" "}
        tickets
      </p>
      <div className="flex gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-1">
          {getPageNumbers().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`w-7 h-7 text-xs rounded-lg transition-colors ${
                currentPage === pageNum
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 text-gray-500 hover:text-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};
