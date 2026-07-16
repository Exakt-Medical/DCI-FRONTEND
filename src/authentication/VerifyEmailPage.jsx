import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import api from "../services/api";

export const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token provided.");
      return;
    }

    api.get(`/auth/verify-email?token=${token}`)
      .then((res) => {
        setStatus("success");
        setMessage(res.data.message || "Email verified successfully.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.response?.data?.error || "Verification failed.");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="h-1 bg-primary-500" />
        <div className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 size={48} className="mx-auto mb-4 text-primary-500 animate-spin" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verifying your email...</h2>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Email Verified!</h2>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              <Link
                to="/dci-access"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all"
              >
                Go to Login
              </Link>
            </>
          )}
          {status === "error" && (
            <>
              <XCircle size={48} className="mx-auto mb-4 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Verification Failed</h2>
              <p className="text-sm text-gray-600 mb-6">{message}</p>
              <Link
                to="/dci-access"
                className="inline-block bg-primary-500 hover:bg-primary-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all"
              >
                Go to Login
              </Link>
            </>
          )}
        </div>
        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50">
          <p className="text-center text-[10px] text-gray-400">
            &copy; 2026 DCI Clearance Verification System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
