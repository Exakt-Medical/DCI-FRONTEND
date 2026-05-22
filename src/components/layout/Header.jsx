import { UserMenu } from "./UserMenu";

export function Header({
  currentPage,
  isSidebarOpen,
  user,
  role,
  onMyProfile,
  onChangePassword,
  onLogout,
}) {
  const getPageTitle = () => {
    if (currentPage === "transfer-vouchers") return "Transfer Vouchers";
    return currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {getPageTitle()}
          </h1>
          <p className="text-xs text-gray-500">
            Vehicle Verification Insurance Program
          </p>
        </div>
        <UserMenu
          user={user}
          role={role}
          isSidebarOpen={isSidebarOpen}
          onMyProfile={onMyProfile}
          onChangePassword={onChangePassword}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
