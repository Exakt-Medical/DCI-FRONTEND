import { useState, useEffect, useRef } from "react";
import { Expand, Minimize, Bell, Check } from "lucide-react";
import { UserMenu } from "./UserMenu";
import { notificationService } from "../../services/notificationService";

const PAGE_TITLES = {
  "dashboard": "Dashboard",
  "requests": "My Requests / Queue",
  "new-transaction-credits": "Transaction Credits",
  "new-clearance-request": "Request for Certification",
  "profile": "My Profile",
  "verification": "Verify Vehicle",
  "tickets": "Support Tickets",
  "accounts": "Accounts",
  "activitylogs": "Activity Logs",
  "accesslogs": "Access Logs",
  "transactions": "Transaction Logs",
  "certificate-lookup": "Certificate Lookup",
};

export const Header = ({
  currentPage,
  isSidebarOpen,
  user,
  role,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      // silently fail
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {}
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {}
  };

  const notifTypeIcon = (type) => {
    if (type === "HPG_VERIFIED") return "Verified by HPG";
    if (type === "DCI_VALIDATED") return "Validated by DCI";
    return "Notification";
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 capitalize">
          {PAGE_TITLES[currentPage] || currentPage.replace(/-/g, " ")}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* NOTIFICATION BELL */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifPanel(!showNotifPanel)}
            className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Bell size={18} className="text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifPanel && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-[#1a3a6b] hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-400">
                    No notifications yet
                  </div>
                ) : (
                  notifications.slice(0, 20).map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                        !n.isRead ? "bg-blue-50/50" : ""
                      }`}
                      onClick={() => {
                        if (!n.isRead) handleMarkAsRead(n.id);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {!n.isRead ? (
                            <div className="w-2 h-2 rounded-full bg-[#1a3a6b]" />
                          ) : (
                            <Check size={12} className="text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-600"}`}>
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {n.dateCreated ? new Date(n.dateCreated).toLocaleString() : ""}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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
