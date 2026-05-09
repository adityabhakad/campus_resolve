import CampusIcon from "../components/CampusIcon";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Clock, Zap, CheckCircle2, Users, Building, Activity, Mail, Phone, MapPin, ChevronRight, Share2, Globe, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

// CountUp Hook for statistics animation
const useCountUp = (end, duration = 2000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Easing function (easeOutQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeProgress * end));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    animationFrame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return count;
};

const StatCard = ({ icon, end, suffix = "", title, colorClass = "blue" }) => {
  const count = useCountUp(end);
  const colorMap = {
    blue: "text-primary bg-blue-50 ring-blue-50/50 group-hover:bg-primary",
    orange: "text-orange-600 bg-orange-50 ring-orange-50/50 group-hover:bg-orange-600",
    green: "text-green-600 bg-green-50 ring-green-50/50 group-hover:bg-green-600",
    purple: "text-purple-600 bg-purple-50 ring-purple-50/50 group-hover:bg-purple-600",
  };
  
  return (
    <div className="group flex flex-col items-center justify-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-2">
      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-6 ring-4 group-hover:scale-110 group-hover:text-white transition-all duration-300 ${colorMap[colorClass]}`}>
        {icon}
      </div>
      <h4 className="text-4xl font-extrabold text-slate-900 mb-2">{count}{suffix}</h4>
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
    </div>
  );
};

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[120px] pointer-events-none z-0" />
      <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-purple-400/20 blur-[100px] pointer-events-none z-0" />
      
      {/* Navigation */}
      <nav className="w-full border-b border-slate-200/50 backdrop-blur-xl bg-white/70 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="p-2 bg-[#FACC15]/10 rounded-xl group-hover:bg-[#FACC15]/20 transition-colors">
              <CampusIcon className="text-[#FACC15] h-6 w-6" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">Campus Resolve</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-[#FACC15] hover:bg-slate-100 px-4 py-2 rounded-full transition-all duration-300">
              Sign In
            </Link>
            <Link to="/register" className="group text-sm font-bold bg-gradient-to-r from-[#FACC15] to-[#EAB308] text-slate-900 px-5 py-2.5 rounded-full shadow-lg shadow-[#FACC15]/25 hover:shadow-xl hover:shadow-[#FACC15]/40 hover:-translate-y-0.5 active:scale-95 transition-all duration-300 flex items-center gap-2">
              Get Started <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative text-center">
          <div className="animate-in slide-in-from-bottom-8 fade-in duration-1000 fill-mode-both flex flex-col items-center w-full">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#FACC15]/20 bg-[#FACC15]/5 px-4 py-1.5 text-xs font-bold text-[#FACC15] mb-8 shadow-sm hover:bg-[#FACC15]/10 transition-colors cursor-default mt-8 lg:mt-0">
              <span className="flex h-2 w-2 rounded-full bg-[#FACC15] animate-pulse"></span>
              The Next-Gen Campus Platform
            </div>
            <h1 className="text-5xl lg:text-7xl xl:text-[5rem] font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
              Resolve Campus Issues <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] via-[#FACC15] to-[#EAB308]">Faster & Smarter</span>
            </h1>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl leading-relaxed font-medium">
              A seamless, intelligent platform connecting students, faculty, and administration to streamline complaints, track progress, and elevate campus life to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center w-full sm:w-auto">
              <Link to="/register" className="group inline-flex h-14 items-center justify-center rounded-full bg-gradient-to-r from-[#FACC15] to-[#EAB308] px-10 text-base font-bold text-slate-900 shadow-xl shadow-[#FACC15]/25 hover:shadow-2xl hover:shadow-[#FACC15]/40 hover:-translate-y-1 active:scale-95 transition-all duration-300">
                Report an Issue <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
              <Link to="/login" className="inline-flex h-14 items-center justify-center rounded-full border-2 border-slate-200 bg-white/50 backdrop-blur-sm px-10 text-base font-bold text-slate-700 shadow-sm hover:border-slate-300 hover:bg-white hover:-translate-y-1 hover:shadow-lg active:scale-95 transition-all duration-300">
                Access Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 bg-white/40 backdrop-blur-md border-y border-slate-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-100 fill-mode-both">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] to-[#EAB308]">Campus Resolve</span> at a Glance
              </h2>
              <p className="text-lg text-slate-600 font-medium">Simplifying issue management for students and administration.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              <StatCard icon={<CheckCircle2 className="h-8 w-8" />} end={500} suffix="+" title="Complaints Resolved" colorClass="green" />
              <StatCard icon={<Building className="h-8 w-8" />} end={10} suffix="+" title="Active Departments" colorClass="blue" />
              <StatCard icon={<Users className="h-8 w-8" />} end={2000} suffix="+" title="Students Supported" colorClass="orange" />
              <StatCard icon={<Activity className="h-8 w-8" />} end={96} suffix="%" title="Resolution Rate" colorClass="purple" />
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-200 fill-mode-both">
            <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Why Choose <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FACC15] to-[#EAB308]">Campus Resolve</span></h2>
            <p className="text-lg text-slate-600 font-medium">We provide a state-of-the-art platform designed to modernize and simplify how campus issues are handled.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 animate-in fade-in duration-1000 delay-300 fill-mode-both">
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 text-blue-600 ring-4 ring-blue-50/50 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <Zap className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Smart Routing</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Complaints are intelligently assigned to the precise department based on category and priority, eliminating manual delays.</p>
            </div>
            
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-6 text-orange-600 ring-4 ring-orange-50/50 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition-all duration-300">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Real-time Tracking</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Follow your complaint resolution journey effortlessly with live status updates, direct messaging, and timeline notifications.</p>
            </div>
            
            <div className="group flex flex-col items-center text-center p-8 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] border border-slate-100 hover:-translate-y-2 transition-all duration-300">
              <div className="h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center mb-6 text-green-600 ring-4 ring-green-50/50 group-hover:scale-110 group-hover:bg-green-600 group-hover:text-white transition-all duration-300">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 mb-3">Anonymous Option</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Report sensitive issues confidentially. Your identity remains perfectly protected while action is swiftly taken.</p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between gap-12 mb-12">
            <div className="max-w-md">
              <div className="flex items-center gap-2 mb-6">
                <CampusIcon className="text-[#FACC15] h-8 w-8" />
                <span className="font-extrabold text-2xl tracking-tight text-white">Campus Resolve</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Empowering universities with smart, seamless, and transparent issue resolution. Creating better campus experiences for everyone.
              </p>
              <div className="flex gap-4">
                <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#FACC15] hover:text-slate-900 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"><MessageSquare className="h-4 w-4" /></a>
                <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#FACC15] hover:text-slate-900 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"><Globe className="h-4 w-4" /></a>
                <a href="#" className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-[#FACC15] hover:text-slate-900 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"><Share2 className="h-4 w-4" /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6">Contact Support</h4>
              <ul className="space-y-4 text-sm">
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-slate-500 shrink-0" />
                  <span className="hover:text-[#FACC15] transition-colors cursor-pointer">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-500 shrink-0" />
                  <span className="hover:text-[#FACC15] transition-colors cursor-pointer">support@campusresolve.edu</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} Campus Resolve. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
      `}} />
    </div>
  );
}
