import CampusIcon from "../components/CampusIcon";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, Mail, Lock, User as UserIcon, Phone } from "lucide-react";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "", email: "", password: "", confirmPassword: "", phoneNumber: ""
  });
  
  const register = useAuthStore(state => state.register);
  const isLoading = useAuthStore(state => state.isLoading);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match!");
    }
    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    
    let finalPhone = formData.phoneNumber.trim();
    if (!finalPhone.startsWith("+91")) {
      finalPhone = `+91 ${finalPhone}`;
    }

    const payload = {
      name: formData.name, email: formData.email, 
      password: formData.password, phoneNumber: finalPhone,
      role: "student"
    };

    const success = await register(payload);
    if (success) navigate("/student-dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-[#FACC15]/10 rounded-full mb-4">
            <CampusIcon className="h-10 w-10 text-[#FACC15]" />
          </div>
          <h2 className="text-center text-3xl font-bold text-slate-900 tracking-tight">Create Student Account</h2>
          <p className="mt-2 text-center text-sm text-slate-500">Join the Campus Resolve network exclusively for students</p>
        </div>

        <form className="space-y-5 flex flex-col" onSubmit={handleSubmit}>
          {/* Common Fields */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input required type="text" className="pl-10 w-full py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] outline-none shadow-sm transition-shadow" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Student Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input required type="email" className="pl-10 w-full py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] outline-none shadow-sm transition-shadow" placeholder="student@campus.edu" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3 text-slate-400 h-5 w-5" />
                <span className="absolute left-10 text-slate-400 font-medium">+91</span>
                <input required type="tel" className="pl-16 w-full py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] outline-none shadow-sm transition-shadow" placeholder="98765 43210" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input required type="password" minLength={6} className="pl-10 w-full py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] outline-none shadow-sm transition-shadow" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input required type="password" minLength={6} className="pl-10 w-full py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FACC15] outline-none shadow-sm transition-shadow" placeholder="••••••••" value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-slate-900 bg-[#FACC15] hover:bg-[#EAB308] focus:ring-2 focus:ring-offset-2 focus:ring-[#FACC15] transition-all disabled:opacity-70 disabled:cursor-not-allowed">
              {isLoading ? "Provisioning..." : "Create Account"}
            </button>
          </div>
          
          <div className="text-center text-sm mt-4">
            <span className="text-slate-500">Already a registered member? </span>
            <Link to="/login" className="font-semibold text-[#FACC15] hover:text-[#FACC15]/80 transition-colors">
              Log in securely
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
