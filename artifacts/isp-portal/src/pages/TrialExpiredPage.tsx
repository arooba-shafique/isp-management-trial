import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Clock, Phone, Mail } from "lucide-react";

export default function TrialExpiredPage() {
  const { logout } = useAuth();
  
  const contactInfo = {
    phone: import.meta.env.VITE_CONTACT_PHONE || "03001234567",
    email: import.meta.env.VITE_CONTACT_EMAIL || "support@netlink-isp.com",
    address: import.meta.env.VITE_CONTACT_ADDRESS || "Office 123, Tech Hub, Main Boulevard, Lahore",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock size={32} className="text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Trial Period Expired</h1>
        
        <p className="text-gray-600 mb-6">
          Your 7-day trial period has ended. To continue using the ISP Management Portal, 
          please contact our sales team to activate your account.
        </p>

        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-gray-800 mb-3">Contact Sales</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Phone size={14} />
              <span>{contactInfo.phone}</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Mail size={14} />
              <span>{contactInfo.email}</span>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          <p>{contactInfo.address}</p>
        </div>

        <Button 
          onClick={logout}
          variant="outline" 
          className="w-full"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
