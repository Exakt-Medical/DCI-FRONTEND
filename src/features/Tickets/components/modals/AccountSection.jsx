import { Lock } from "lucide-react";
import { Card } from "../../../../components/Card";

export const AccountSection = ({ formData, onChange }) => {
  return (
    <Card className="p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Lock size={18} className="text-primary-500" />
        Account Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Username</label>
          <input
            type="text"
            name="accountInfo.username"
            value={formData.accountInfo.username}
            onChange={onChange}
            placeholder="Enter username"
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Role</label>
          <select
            name="accountInfo.role"
            value={formData.accountInfo.role}
            onChange={onChange}
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select role</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Agent">Agent</option>
            <option value="Sub-agent">Sub-agent</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-gray-500">
            Issue Type
          </label>
          <select
            name="accountInfo.action"
            value={formData.accountInfo.action}
            onChange={onChange}
            className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select issue type</option>
            <option value="login">Cannot login</option>
            <option value="forgot_password">Forgot password</option>
            <option value="wrong_role">Wrong role assigned</option>
            <option value="account_locked">Account locked</option>
            <option value="permission">Permission issue</option>
          </select>
        </div>
      </div>
    </Card>
  );
};
