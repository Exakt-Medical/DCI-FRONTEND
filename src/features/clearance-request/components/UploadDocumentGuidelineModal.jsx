import React from "react";
import { Modal } from "../../../components/Modal";
import {
  Camera,
  Maximize2,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info
} from "lucide-react";

export const UploadDocumentGuidelineModal = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Document Upload Guidelines"
      size="lg"
    >
      <div className="p-6 space-y-6 text-gray-800">
        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            To ensure the system accurately extracts information from your **Official Receipt (OR)** and **Certificate of Registration (CR)**, please follow the guidelines below before uploading.
          </p>
        </div>

        {/* Grid Guidelines */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dos */}
          <div className="space-y-4">
            <h4 className="font-bold text-green-700 flex items-center gap-2 text-sm border-b border-green-100 pb-2">
              <CheckCircle className="w-4 h-4" /> Good Practices (Recommended)
            </h4>

            {/* Dos items */}
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">1. Image Quality</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Capture the document in a well-lit environment. Avoid shadows, glare, reflections, or camera flash that may obscure text.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <Maximize2 className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">2. Positioning</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Place the document on a flat surface. Capture the entire document, including all four corners. Hold camera directly above.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-gray-900">3. Document Condition</h5>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Upload a clear, readable copy of the original document. Make sure text is not covered, folded, or damaged.
                  </p>
                </div>
              </div>
            </div>

            {/* OCR & File support info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 mt-4">
              <h5 className="text-xs font-bold text-gray-900">🖼 Supported File Types</h5>
              <p className="text-[11px] text-gray-600">
                Accepted formats: **JPG / JPEG / PNG / PDF**. Maximum file size: **10 MB**.
              </p>
            </div>
          </div>

          {/* Don'ts */}
          <div className="space-y-4">
            <h4 className="font-bold text-red-700 flex items-center gap-2 text-sm border-b border-red-100 pb-2">
              <XCircle className="w-4 h-4" /> Things to Avoid
            </h4>

            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Blurry or low-resolution photos</span>
              </div>
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Cropped documents missing corners or text</span>
              </div>
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Documents with excessive glare, flash reflection or shadows</span>
              </div>
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Multiple documents in a single image</span>
              </div>
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Screenshots of documents instead of actual photos/scans</span>
              </div>
              <div className="flex items-start gap-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100/50">
                <span className="text-red-500 font-bold shrink-0">✕</span>
                <span className="text-gray-700">Folded, wrinkled, or partially hidden documents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#0059b5] hover:bg-[#004a96] text-white text-xs font-bold rounded-lg transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </Modal>
  );
};
