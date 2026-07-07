import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/Spinner";
import { CheckCircle } from "lucide-react";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const { handleLogin, isAuthenticated, role } = useAuth();

  useEffect(() => {
    // Simulate verification process
    localStorage.setItem("isVerified", "true");
    
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // If already logged in (somehow), just go to dashboard/requests
        const dest = role === "citizen" ? "/dci-access/requests" : "/dci-access/dashboard";
        navigate(dest);
      } else {
        // If not logged in, mock a citizen login since this is for citizen registration flow
        // Note: For a real app, clicking the email link might just show a success message and ask to login, 
        // or automatically log them in if the token is valid.
        handleLogin("citizen", { isVerified: true });
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate, handleLogin, isAuthenticated, role]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-500" size={40} />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Email...</h2>
        <p className="text-gray-500 mb-8">
          Please wait while we verify your email address and prepare your account.
        </p>
        
        <div className="flex justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    </div>
  );
};
