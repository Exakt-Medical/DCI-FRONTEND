import { useState, useEffect } from "react";
import { Mail, Search, Menu, Inbox, Star, Send, File, AlertCircle, ChevronLeft } from "lucide-react";

export const MockEmailInbox = () => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [currentTime, setCurrentTime] = useState("");
  
  useEffect(() => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, []);

  const emails = [
    {
      id: 1,
      sender: "DCI Clearance System",
      subject: "Action Required: Verify your DCI Clearance Account",
      snippet: "Please verify your email address to complete your registration...",
      time: currentTime || "Just now",
      unread: true,
      content: (
        <div className="space-y-6 text-gray-800">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#1a3a6b] rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">DCI</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-900">Verify your email address</h2>
          
          <p className="text-base text-gray-600">
            Hello Citizen,
          </p>
          <p className="text-base text-gray-600">
            Thank you for registering for the DCI Clearance Verification System. To unlock all modules and begin your transactions, please click the button below to verify your email address.
          </p>
          
          <div className="text-center pt-4 pb-4">
            <a 
              href="/dci-access/verify?token=mock_verification_token_123"
              className="inline-block bg-[#1a3a6b] hover:bg-[#1a3a6b]/90 text-white font-semibold py-3 px-8 rounded-lg transition-colors shadow-sm"
            >
              Verify Email Address
            </a>
          </div>
          
          <p className="text-sm text-gray-500 border-t border-gray-200 pt-6 mt-6">
            If you did not request this verification, please ignore this email.
          </p>
          <p className="text-xs text-gray-400 text-center mt-8">
            © 2026 DCI Clearance Verification System. All rights reserved.
          </p>
        </div>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 text-[#1a3a6b] font-bold text-xl gap-2">
          <Mail className="text-[#1a3a6b]" /> WebMail
        </div>
        <div className="p-4">
          <button className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium py-3 rounded-xl flex justify-center items-center gap-2 transition-colors">
            <span className="text-lg">+</span> Compose
          </button>
        </div>
        <nav className="flex-1 px-3 space-y-1 mt-2">
          <a href="#" className="flex items-center justify-between px-3 py-2.5 bg-blue-50 text-blue-700 rounded-lg font-medium">
            <div className="flex items-center gap-3"><Inbox size={18} /> Inbox</div>
            <span className="bg-blue-200 text-blue-700 text-xs py-0.5 px-2 rounded-full">1</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
            <Star size={18} /> Starred
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
            <Send size={18} /> Sent
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
            <File size={18} /> Drafts
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
            <AlertCircle size={18} /> Spam
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4 flex-1">
            <button className="md:hidden text-gray-500 hover:text-gray-700">
              <Menu size={24} />
            </button>
            <div className="max-w-2xl w-full relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search mail" 
                className="w-full bg-gray-100 border-transparent focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-lg py-2 pl-10 pr-4 text-sm transition-all"
              />
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            C
          </div>
        </header>

        {/* Email Area */}
        <main className="flex-1 overflow-hidden relative">
          {selectedEmail ? (
            <div className="h-full flex flex-col bg-white overflow-y-auto">
              <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex items-center gap-4 z-10">
                <button 
                  onClick={() => setSelectedEmail(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900">{selectedEmail.subject}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-semibold text-sm text-gray-800">{selectedEmail.sender}</span>
                    <span className="text-xs text-gray-500">{"<noreply@dciclearance.gov.ph>"}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {selectedEmail.time}
                </div>
              </div>
              <div className="p-8 max-w-3xl mx-auto w-full">
                {selectedEmail.content}
              </div>
            </div>
          ) : (
            <div className="h-full overflow-y-auto bg-white">
              {emails.map((email) => (
                <div 
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`flex items-center gap-4 px-6 py-4 border-b border-gray-100 cursor-pointer transition-colors ${email.unread ? 'bg-blue-50/30' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" onClick={e => e.stopPropagation()} />
                  </div>
                  <div className="flex-shrink-0">
                    <Star size={18} className="text-gray-300 hover:text-yellow-400" />
                  </div>
                  <div className={`w-48 flex-shrink-0 ${email.unread ? 'font-bold text-gray-900' : 'text-gray-700'}`}>
                    {email.sender}
                  </div>
                  <div className="flex-1 truncate">
                    <span className={email.unread ? 'font-bold text-gray-900' : 'text-gray-800'}>{email.subject}</span>
                    <span className="text-gray-500 ml-2">- {email.snippet}</span>
                  </div>
                  <div className={`w-20 text-right text-xs ${email.unread ? 'font-bold text-blue-600' : 'text-gray-500'}`}>
                    {email.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
