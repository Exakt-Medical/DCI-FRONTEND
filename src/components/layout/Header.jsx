import { UserMenu } from "./UserMenu";

export const Header = ({
  currentPage,
  isSidebarOpen,
  user,
  role,
  onMyProfile,
  onChangePassword,
  onLogout,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800 capitalize">
          {currentPage}
        </h1>
      </div>

      <UserMenu
        user={user}
        role={role}
        isSidebarOpen={isSidebarOpen}
        onMyProfile={onMyProfile}
        onChangePassword={onChangePassword}
        onLogout={onLogout}
      />
    </header>
  );
};
