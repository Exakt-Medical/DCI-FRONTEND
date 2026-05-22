import { useState } from "react";
import { cn } from "../../utils/cn";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { navConfig } from "../../constants/navigation";
import { userInfo } from "../../utils/userInfo";

export const AdminLayout = ({
  children,
  currentPage,
  onNavigate,
  role,
  onLogout,
  onMyProfile,
  onChangePassword,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const currentNav = navConfig[role] || navConfig.admin;
  const currentUser = userInfo[role] || userInfo.admin;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <Sidebar
          navConfig={currentNav}
          currentPage={currentPage}
          onNavigate={onNavigate}
          isSidebarOpen={sidebarOpen}
          setIsSidebarOpen={setSidebarOpen}
        />

        <div
          className={cn(
            "flex-1 transition-all duration-300",
            sidebarOpen ? "ml-64" : "ml-20",
          )}
        >
          <Header
            currentPage={currentPage}
            isSidebarOpen={sidebarOpen}
            user={currentUser}
            role={role}
            onMyProfile={onMyProfile}
            onChangePassword={onChangePassword}
            onLogout={onLogout}
          />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
