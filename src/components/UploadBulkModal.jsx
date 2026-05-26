import { useState, useRef } from "react";
import { X, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";

export const UploadBulkModal = ({ isOpen, onClose, onUpload, templateHeaders, moduleName }) => {
  const [file, setFile] = useState(null);
  const [allData, setAllData] = useState([]);
  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleName}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseCSV = (text) => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = parseCSV(ev.target.result);
      setAllData(data);
      setPreview(data.slice(0, 5));
    };
    reader.readAsText(f);
  };

  const handleUpload = async () => {
    if (!file || allData.length === 0) return;
    setUploading(true);
    setResult(null);
    try {
      const response = await onUpload(allData);
      setResult({ type: "success", message: `Successfully uploaded ${response.data?.length || allData.length} records.` });
      setFile(null);
      setAllData([]);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setResult({ type: "error", message: err.response?.data?.error || err.message || "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-700 rounded-t-2xl" />
          <div className="flex items-center justify-between p-5 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
                <FileSpreadsheet size={16} className="text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bulk Upload {moduleName}</h2>
                <p className="text-xs text-gray-500 mt-0.5">Upload CSV file to add multiple records</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex gap-3">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 border border-primary-300 rounded-xl hover:bg-primary-50 transition-colors"
            >
              <Download size={16} /> Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
            <Upload size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-1">Drop a CSV file here or click to browse</p>
            <p className="text-xs text-gray-400">Expected columns: {templateHeaders.join(", ")}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
              className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-600 hover:file:bg-primary-100"
            />
          </div>

          {file && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle size={16} /> {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Preview (first {preview.length} rows):</p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {Object.keys(preview[0]).map((h) => (
                        <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {preview.map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="px-3 py-1.5 text-gray-700">{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-1">Total parsed: {allData.length} rows</p>
            </div>
          )}

          {result && (
            <div className={`rounded-lg p-3 text-sm flex items-center gap-2 ${
              result.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
            }`}>
              {result.type === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {result.message}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || allData.length === 0 || uploading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? "Uploading..." : `Upload ${allData.length} Records`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
