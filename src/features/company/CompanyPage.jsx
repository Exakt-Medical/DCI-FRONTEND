import { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { StatusBadge } from "../../components/StatusBadge";
import { companyService } from "../../services/companyService";

export const CompanyPage = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const tabs = ["All", "Pending", "Active", "Inactive", "Declined", "Deactivated"];

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await companyService.getAll();
      setCompanies(res.data);
    } catch (err) {
      console.error("Failed to load companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === "All" ? companies : companies.filter(c => c.status === filter.toUpperCase());
  const cn = (...classes) => classes.filter(Boolean).join(" ");

  const handleAction = async (action, id) => {
    if (action === "approve" || action === "decline") {
      try {
        await companyService.updateStatus(id, action);
        loadCompanies();
      } catch (err) {
        console.error("Failed to update company:", err);
      }
    } else if (action === "edit") {
      setEditTarget(companies.find(c => c.id === id));
      setShowModal(true);
    }
  };

  const handleSave = async () => {
    setShowModal(false);
    loadCompanies();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-1">Company Management</h1>
          <p className="text-sm text-gray-500 dark:text-slate-500">Manage insurance company accounts and approvals</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setShowModal(true); }}>+ Add Company</Button>
      </div>
      <div className="flex gap-1 mb-5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 border border-gray-200 dark:border-gray-700 w-fit flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold transition-all",
              filter === t ? "bg-primary-500 text-white" : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
            )}
          >
            {t}
            {t !== "All" && <span className="ml-1.5 text-[10px] opacity-70">
              {companies.filter(c => t.toUpperCase() === c.status).length}
            </span>}
          </button>
        ))}
      </div>
      <Card>
        {loading ? (
          <div className="p-5 text-center text-gray-500">Loading companies...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {["Code", "Name", "Provider", "Status", "Date Created", "Actions"].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-slate-400 px-5 py-3 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-primary-600 dark:text-primary-400">{c.code}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs">🏢</div>
                          <span className="text-gray-900 dark:text-white text-xs font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-slate-400 text-xs">{c.provider}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-slate-500 text-xs">{c.dateCreated}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button title="Approve" onClick={() => handleAction("approve", c.id)} className="w-7 h-7 rounded-lg bg-limerick-500/10 hover:bg-limerick-500/20 text-limerick-600 dark:text-limerick-400 text-sm transition-all flex items-center justify-center">✓</button>
                          <button title="Deny" onClick={() => handleAction("decline", c.id)} className="w-7 h-7 rounded-lg bg-carnelian-500/10 hover:bg-carnelian-500/20 text-carnelian-600 dark:text-carnelian-400 text-sm transition-all flex items-center justify-center">✕</button>
                          <button title="Edit" onClick={() => handleAction("edit", c.id)} className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-slate-400 text-xs transition-all flex items-center justify-center">✎</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-500 dark:text-slate-500">No companies found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-slate-500">Showing {filtered.length} of {companies.length} companies</p>
            </div>
          </>
        )}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editTarget ? "Edit Company" : "Add New Company"} size="md">
        <div className="p-6 grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Company Name" defaultValue={editTarget?.name} placeholder="Company name" /></div>
          <Input label="Company Code" defaultValue={editTarget?.code} placeholder="e.g. PIC-001" />
          <Input label="Branch Name" defaultValue={editTarget?.branch} placeholder="Branch" />
          <div className="col-span-2"><Input label="Address" defaultValue={editTarget?.address} placeholder="Full address" /></div>
          <div className="col-span-2 flex justify-end gap-2 mt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editTarget ? "Save Changes" : "Add Company"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};