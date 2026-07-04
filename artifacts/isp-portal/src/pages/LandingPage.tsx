import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useListPublicPackages, getListPublicPackagesQueryKey, customFetch } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Wifi,
  Zap,
  Shield,
  Activity,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Clock,
  CheckCircle2,
  Smartphone,
  UserCheck,
  CreditCard,
  Check,
  Menu,
  X
} from "lucide-react";

type Pkg = {
  id: number;
  name: string;
  speedMbps: number;
  price: number;
  validity: string;
  description?: string | null;
  isActive: boolean;
};

export default function LandingPage() {
  const [, navigate] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch live packages from the public endpoint
  const { data: packages = [], isLoading: packagesLoading } = useListPublicPackages({
    query: { queryKey: getListPublicPackagesQueryKey() }
  });

  const activePackages = (packages as Pkg[]).filter((p) => p.isActive);
  const maxSpeed = Math.max(...activePackages.map(p => p.speedMbps), 0);

  const [zones, setZones] = useState<string[]>([]);
  useEffect(() => {
    customFetch("/api/zones").then((d: any) => {
      setZones((d as Array<{name: string}>).map(z => z.name));
    }).catch(() => {});
  }, []);

  function handleSubscribeRedirect(pkgName: string) {
    toast({
      title: "Login Required",
      description: `Please register or login to subscribe to the ${pkgName} plan.`
    });
    navigate("/login");
  }

  const validityLabel = (v: string) => {
    return { monthly: "Monthly", quarterly: "Quarterly (3 mo)", yearly: "Yearly" }[v] ?? v;
  };

  const getSpeedCategory = (speed: number) => {
    if (speed <= 10) return { tier: "Standard", desc: "Best for social browsing & SD streaming" };
    if (speed <= 25) return { tier: "Super Speed", desc: "Best for HD streaming & multiple devices" };
    return { tier: "Ultra Fiber", desc: "Best for 4K streaming, online gaming & smart homes" };
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-primary selection:text-white overflow-x-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10 animate-pulse duration-5000" />
      <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 left-10 w-[450px] h-[450px] bg-emerald-600/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* STICKY HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Wifi size={20} className="text-white animate-bounce duration-3000" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent">
                NetLink
              </span>
              <span className="text-[10px] block font-semibold text-primary tracking-widest uppercase -mt-1">
                ISP Sahiwal
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <a href="#features" className="hover:text-white transition-colors duration-200">
              How It Works
            </a>
            <a href="#packages" className="hover:text-white transition-colors duration-200">
              Packages
            </a>
            <a href="#contact" className="hover:text-white transition-colors duration-200">
              Contact
            </a>
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() =>
                  navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard")
                }
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4.5 py-2 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-emerald-950/30 flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} />
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="text-slate-300 hover:text-white text-sm font-semibold transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="bg-primary hover:bg-primary/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 flex items-center gap-1"
                >
                  Get Started
                  <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-b border-slate-900 px-4 py-4 space-y-3.5 absolute w-full left-0 z-50 transition-all duration-300">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-400 hover:text-white font-medium text-sm"
            >
              How It Works
            </a>
            <a
              href="#packages"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-400 hover:text-white font-medium text-sm"
            >
              Packages
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-slate-400 hover:text-white font-medium text-sm"
            >
              Contact
            </a>
            <div className="pt-2 flex flex-col gap-2.5">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard");
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-center py-2.5 rounded-xl text-sm font-semibold"
                >
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full text-slate-300 hover:text-white py-2 rounded-xl text-sm font-semibold border border-slate-800 hover:bg-slate-900"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate("/login");
                    }}
                    className="w-full bg-primary hover:bg-primary/95 text-white text-center py-2.5 rounded-xl text-sm font-semibold"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary font-semibold tracking-wide uppercase">
              <Activity size={14} className="animate-pulse" />
              Sahiwal's Premium Fiber Provider
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Ultra-Fast & <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Rock-Solid
              </span>{" "}
              Fiber Internet
            </h1>
            <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Experience buffering-free 4K streaming, low-latency online gaming, and seamless smart-home connectivity. NetLink ISP brings high-speed fiber-to-the-home (FTTH) directly to your doorstep in Sahiwal.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#packages"
                className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white text-center px-8 py-3.5 rounded-xl font-bold transition-all duration-200 hover:shadow-lg hover:shadow-primary/30"
              >
                View Packages
              </a>
              {isAuthenticated ? (
                <button
                  onClick={() =>
                    navigate(user?.role === "admin" ? "/admin/dashboard" : "/dashboard")
                  }
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-center px-8 py-3.5 rounded-xl font-bold transition-all duration-200"
                >
                  Enter Dashboard
                </button>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-center px-8 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5"
                >
                  Join NetLink
                  <ArrowRight size={16} />
                </button>
              )}
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-900 max-w-md mx-auto lg:mx-0">
              <div>
                <span className="block text-2xl font-extrabold text-white">99.9%</span>
                <span className="text-xs text-slate-500 font-medium">Uptime SLA</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-white">200+</span>
                <span className="text-xs text-slate-500 font-medium">Customers</span>
              </div>
              <div>
                <span className="block text-2xl font-extrabold text-white">&lt;10ms</span>
                <span className="text-xs text-slate-500 font-medium">Local Ping</span>
              </div>
            </div>
          </div>

          {/* Interactive Hero Graphic */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-square rounded-3xl bg-slate-900/40 border border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-sm overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-500" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Live Status
                  </span>
                </div>
                <span className="text-[10px] font-mono text-primary font-bold px-2 py-0.5 bg-primary/10 rounded-full border border-primary/20">
                  FTTH-NODE-SWL
                </span>
              </div>

              {/* Central Speed Widget */}
              <div className="my-auto text-center space-y-2 py-8 relative">
                <div className="inline-flex w-24 h-24 rounded-full border-4 border-slate-800 border-t-primary items-center justify-center animate-spin duration-[4s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4">
                  <span className="block text-4xl font-black text-white tracking-tight">{maxSpeed || 50}</span>
                  <span className="block text-[10px] font-bold text-primary tracking-widest uppercase -mt-1.5">
                    Mbps
                  </span>
                </div>
                <div className="pt-2 text-xs font-semibold text-slate-400">
                  Active User Speed Test
                </div>
              </div>

              {/* Status List */}
              <div className="bg-slate-950/80 border border-slate-800/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Latency</span>
                  <span className="font-mono text-emerald-400 font-semibold">4 ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Jitter</span>
                  <span className="font-mono text-emerald-400 font-semibold">1.2 ms</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Connected Zones</span>
                  <span className="font-mono text-slate-300 font-semibold">{zones.length ? zones.join(", ") : "Loading..."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="features" className="py-24 bg-slate-900/30 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              How the System Works
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
              From signing up to line activation, explore our fully-integrated digital customer workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800 font-mono">
                01
              </span>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <Smartphone className="text-primary" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Phone Sign In</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enter your phone number. New users register instantly by creating a profile with their address.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800 font-mono">
                02
              </span>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                <Wifi className="text-blue-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Select Package</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browse live internet speed tiers in your dashboard and choose a plan matching your needs.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800 font-mono">
                03
              </span>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-6">
                <CreditCard className="text-amber-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Pay & Submit</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Transfer the bill via EasyPaisa, JazzCash, or Bank. Submit your transaction ID inside the portal.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800 font-mono">
                04
              </span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6">
                <UserCheck className="text-emerald-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Verification</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  An administrator reviews your transaction ID in the dashboard, approving your subscription.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-6 relative flex flex-col justify-between hover:border-slate-700 transition-colors">
              <span className="absolute top-4 right-4 text-3xl font-extrabold text-slate-800 font-mono">
                05
              </span>
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-6">
                <Shield className="text-red-400" size={24} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white">Active support</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Enjoy fiber internet! Submit complaints/tickets from your portal anytime for rapid helpline response.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES SECTION */}
      <section id="packages" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            High-Speed Internet Plans
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Select a high-speed fiber plan. Fully verified, stable rates, and transparent validity.
          </p>
        </div>

        {packagesLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400 font-semibold">Loading packages...</span>
          </div>
        ) : activePackages.length === 0 ? (
          <div className="text-center py-20 border border-slate-900 rounded-3xl bg-slate-900/10 max-w-xl mx-auto">
            <Wifi className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-1">No Active Packages Found</h3>
            <p className="text-xs text-slate-500">
              Please contact the administrator or check back later.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activePackages.map((pkg) => {
              const speedInfo = getSpeedCategory(pkg.speedMbps);
              const isPopular = pkg.speedMbps === 20 || pkg.name.toLowerCase().includes("pro");
              
              return (
                <div
                  key={pkg.id}
                  className={`bg-slate-900/30 border rounded-3xl p-6.5 flex flex-col justify-between shadow-lg backdrop-blur-xs relative transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${
                    isPopular
                      ? "border-primary ring-1 ring-primary/20 shadow-primary/5"
                      : "border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="space-y-5">
                    {/* Header */}
                    <div>
                      <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Zap className="text-primary" size={20} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
                        {speedInfo.tier}
                      </span>
                      <h3 className="text-xl font-bold text-white mt-0.5">{pkg.name}</h3>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {pkg.description || speedInfo.desc}
                      </p>
                    </div>

                    {/* Speed display */}
                    <div className="flex items-baseline gap-2 pt-2 pb-1 border-y border-slate-900">
                      <span className="text-4xl font-black text-white tracking-tight">
                        {pkg.speedMbps}
                      </span>
                      <span className="text-sm font-semibold text-primary uppercase">Mbps</span>
                    </div>

                    {/* Features list */}
                    <ul className="space-y-2.5 text-xs text-slate-300 font-medium">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>Fiber-to-the-Home (FTTH)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>Unlimited Download & Upload</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>Free Smart ONU Optical Router</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-500 flex-shrink-0" />
                        <span>24/7 Priority Support Helpline</span>
                      </li>
                    </ul>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-900">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <span className="block text-2xl font-extrabold text-white">
                          Rs. {Number(pkg.price).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
                          Inclusive of Tax
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold px-2.5 py-1 bg-slate-800/80 border border-slate-800 rounded-lg">
                        {validityLabel(pkg.validity)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleSubscribeRedirect(pkg.name)}
                      className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-200 ${
                        isPopular
                          ? "bg-primary hover:bg-primary/95 text-white"
                          : "bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white"
                      }`}
                    >
                      Subscribe Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CTA SECTION */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-r from-primary/80 to-blue-900/60 border border-primary/20 px-8 py-12 md:py-16 md:px-12 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-primary/5 overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none -z-10" />
          <div className="space-y-4 max-w-2xl text-center md:text-left">
            <h2 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Upgrade to High-Speed Fiber?
            </h2>
            <p className="text-slate-100/80 text-sm sm:text-base">
              Join NetLink ISP today. Enjoy blazing speeds, dedicated bandwidth, and stellar 24/7 technical customer support.
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="w-full md:w-auto bg-white hover:bg-slate-100 text-slate-950 px-8 py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            Get Connected Now
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* CONTACT & INQUIRY SECTION */}
      <section id="contact" className="py-24 border-t border-slate-900/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Contact Details */}
            <div className="lg:col-span-12 space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block">
                  Support Helpdesk
                </span>
                <h2 className="text-3xl font-extrabold text-white">Contact NetLink</h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  Have questions about connectivity, installation charge, or customized corporate bandwidth? Drop us a line or call directly.
                </p>
              </div>

              <div className="space-y-5 text-sm font-medium text-slate-300">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Helpline Numbers
                    </span>
                    <a href="tel:03496641464" className="hover:text-primary transition-colors block">
                      0349-6641464
                    </a>
                    <a href="tel:03286687112" className="hover:text-primary transition-colors block">
                      0328-6687112
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Support Email
                    </span>
                    <a href="mailto:support@netlink.pk" className="hover:text-primary transition-colors">
                      support@netlink.pk
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Physical Office
                    </span>
                    <p className="text-slate-300">
                      NetLink ISP Office, Sahiwal, Punjab, Pakistan
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-primary flex-shrink-0">
                    <Clock size={18} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                      Business Hours
                    </span>
                    <p className="text-slate-300">
                      Helpline: 24/7 Service | Office: 9 AM - 6 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Empty (form removed) */}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/20">
              <Wifi size={16} className="text-primary animate-pulse" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">NetLink ISP</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium text-center">
            &copy; {new Date().getFullYear()} NetLink ISP (Sahiwal). All rights reserved. Made for Sahiwal's Homes & Businesses.
          </p>
        </div>
      </footer>
    </div>
  );
}
