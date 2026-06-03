import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { AlertCircle, Camera } from "lucide-react";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";

export const HpgQrScannerModal = ({ isOpen, onClose, onScan }) => {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const hasScannedRef = useRef(false);

  const [isStarting, setIsStarting] = useState(false);
  const [scanError, setScanError] = useState("");
  const [restartKey, setRestartKey] = useState(0);
  const cameraSupported =
    typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!cameraSupported) {
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      setIsStarting(true);
      setScanError("");
      hasScannedRef.current = false;

      try {
        const scanner = new QrScanner(
          videoRef.current,
          (result) => {
            if (hasScannedRef.current) return;

            const scannedText =
              typeof result === "string" ? result : result?.data ?? "";
            const normalizedCode = scannedText.trim().toUpperCase();

            if (!normalizedCode) return;

            if (!normalizedCode.startsWith("VCH")) {
              setScanError(
                "Invalid QR content. Expected voucher code format like VCH-XXXXXX.",
              );
              return;
            }

            hasScannedRef.current = true;
            onScan(normalizedCode);
          },
          {
            preferredCamera: "environment",
            maxScansPerSecond: 8,
            highlightScanRegion: true,
            highlightCodeOutline: true,
          },
        );

        scannerRef.current = scanner;
        await scanner.start();
      } catch (error) {
        const message =
          error?.name === "NotAllowedError"
            ? "Camera permission denied. Allow access and try again."
            : "Unable to access camera. You can still enter the voucher manually.";

        if (isMounted) {
          setScanError(message);
        }
      } finally {
        if (isMounted) {
          setIsStarting(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      hasScannedRef.current = false;

      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen, restartKey, onScan, cameraSupported]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan Voucher QR"
      size="md"
    >
      <div className="p-5 space-y-4">
        <div className="rounded-xl overflow-hidden bg-black border border-gray-200">
          <video
            ref={videoRef}
            muted
            playsInline
            className="w-full h-[280px] object-cover"
          />
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-2">
          <Camera size={14} className="text-[#0059b5]" />
          Point your camera at a voucher QR code.
        </div>

        {isStarting && (
          <p className="text-xs text-gray-500">Starting camera...</p>
        )}

        {(scanError || !cameraSupported) && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>
              {scanError || "Camera is not supported on this browser. Use manual voucher entry."}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setRestartKey((prev) => prev + 1)}
          >
            Retry Scan
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
