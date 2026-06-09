import { useState, useEffect } from "react";
import { Expand, Minimize } from "lucide-react";
import { UserMenu } from "./UserMenu";

export const Header = ({
  currentPage,
  isSidebarOpen,
  user,
  role,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // toggle fullscreen
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // sync state if user exits fullscreen via ESC
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 capitalize">
          {currentPage}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* FULLSCREEN BUTTON */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize size={18} /> : <Expand size={18} />}
        </button>

        {/* USER MENU */}
        <UserMenu
          user={user}
          role={role}
          isSidebarOpen={isSidebarOpen}
        />
      </div>
    </header>
  );
};
