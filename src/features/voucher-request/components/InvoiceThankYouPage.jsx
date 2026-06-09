import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function InvoiceThankYouPage({
    reference = "INV-000650",
    merchantReference = "test2342345435wd12341",
    emailAddress = "your registered email address",
    initialCountdown = 10
}) {
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState(initialCountdown);
    const navigate = useNavigate();

    // Auto-redirection countdown timer
    useEffect(() => {
        if (timeLeft <= 0) {
            navigate("/vvip-access/vouchers");
            return;
        }
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft, navigate]);

    const handleManualRedirect = (e) => {
        e.preventDefault();
        navigate("/vvip-access/vouchers");
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(reference);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-[#f4f6fc] z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-xl max-w-xl w-full p-8 md:p-12 border border-slate-100/50 flex flex-col items-center">

                {/* Celebration Star & Confetti Illustration */}
                <div className="relative w-40 h-40 flex items-center justify-center mb-6">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        {/* Confetti Streamers */}
                        <path d="M 30,25 C 27,20 28,15 25,12" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 70,25 C 73,20 72,15 75,12" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 20,60 C 15,62 12,58 9,60" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M 80,60 C 85,62 88,58 91,60" fill="none" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Dots / Confetti */}
                        <circle cx="20" cy="35" r="2.5" fill="#3b82f6" />
                        <circle cx="80" cy="35" r="2.5" fill="#f43f5e" />
                        <circle cx="15" cy="50" r="2" fill="#eab308" />
                        <circle cx="85" cy="50" r="2" fill="#10b981" />
                        <circle cx="35" cy="15" r="2" fill="#a855f7" />
                        <circle cx="65" cy="15" r="2.5" fill="#f97316" />
                        <circle cx="48" cy="12" r="1.5" fill="#ec4899" />
                    </svg>

                    {/* Golden Star Graphic */}
                    <svg
                        className="w-24 h-24 filter drop-shadow-[0_8px_16px_rgba(245,158,11,0.2)] animate-bounce"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ animationDuration: '3s' }}
                    >
                        <defs>
                            <linearGradient id="star-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#fbbf24" />
                                <stop offset="100%" stopColor="#f59e0b" />
                            </linearGradient>
                        </defs>
                        <path
                            d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.786 1.4 8.168L12 18.896l-7.334 3.857 1.4-8.168L.132 9.21l8.2-1.192z"
                            fill="url(#star-gradient)"
                        />
                    </svg>

                    {/* Subtle Shadow Oval underneath the star */}
                    <div className="absolute bottom-6 w-16 h-1.5 bg-slate-100 rounded-full blur-[1px]"></div>
                </div>

                {/* Title */}
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 text-center tracking-tight mb-3">
                    Thank you!
                </h1>

                {/* Description Message */}
                <p className="text-slate-500 text-center text-sm md:text-base leading-relaxed max-w-sm mb-6">
                    An invoice has been successfully sent to <span className="font-semibold text-slate-700">{emailAddress}</span>. Please check your email and follow the payment instructions to complete your transaction.
                </p>

                {/* Reference Number with Copy Button */}
                <div className="mb-10 w-full flex justify-center">
                    <div className="inline-flex max-w-full items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm">
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex-shrink-0">
                                Ref:
                            </span>
                            <span className="font-mono text-sm font-bold text-slate-700 truncate">
                                {reference}
                            </span>
                        </div>

                        <div className="relative group flex flex-shrink-0 items-center">
                            <button
                                type="button"
                                onClick={copyToClipboard}
                                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-[#1a3a6b] active:bg-slate-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1a3a6b]/20"
                                aria-label="Copy reference number"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                </svg>
                            </button>
                            <span className={`pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm transition-all duration-150 ${copied ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0"}`}>
                                {copied ? "Copied" : "Copy"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Auto Redirection with Text Countdown (No Circle SVG) */}
                <div className="flex flex-col items-center mb-8">
                    <p className="text-slate-500 text-sm text-center leading-relaxed max-w-sm">
                        You will be redirected to the Voucher Page in <span className="font-extrabold text-[#1a3a6b]">{timeLeft} seconds</span>.
                        <br />
                        Or click{" "}
                        <a
                            href="#"
                            onClick={handleManualRedirect}
                            className="text-[#1a3a6b] hover:text-[#143055] font-bold underline transition-colors"
                        >
                            here
                        </a>{" "}
                        to redirect manually.
                    </p>
                </div>

                {/* Branding Logo Footer */}
                <div className="flex items-center justify-center gap-1.5 mt-6 text-[#1a3a6b] font-bold text-sm tracking-tight select-none border-t border-slate-50 pt-6 w-full">
                    {/* Logo icon resembling flow-ui waves */}
                    <svg className="w-5 h-5 text-[#1a3a6b]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span>vvip portal</span>
                </div>

            </div>
        </div>
    );
}
