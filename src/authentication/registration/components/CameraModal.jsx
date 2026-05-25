import { useRef, useEffect } from "react";
import { Camera, X } from "lucide-react";

export const CameraModal = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { exact: "environment" } } })
        .catch(() => navigator.mediaDevices.getUserMedia({ video: true }));
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current.play();
      }
    } catch (error) {
      console.error("Camera error:", error);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current?.videoWidth) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], "profile-photo.jpg", {
          type: "image/jpeg",
        });
        const preview = URL.createObjectURL(file);
        onCapture(file, preview);
        stopCamera();
        onClose();
      },
      "image/jpeg",
      0.85,
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full overflow-hidden">
        <div className="bg-primary-600 px-4 py-3 flex justify-between items-center">
          <h3 className="text-white font-medium flex items-center gap-2">
            <Camera className="w-4 h-4" /> Take a Photo
          </h3>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full rounded-lg bg-black"
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={capturePhoto}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
};
