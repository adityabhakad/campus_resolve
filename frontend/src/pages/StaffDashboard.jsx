import CampusIcon from "../components/CampusIcon";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, LogOut, CheckCircle2, 
  AlertCircle, Clock, Menu, X, ShieldCheck, KeyRound,
  Eye, MessageSquare, Send, User, Lock, Pin, PinOff, MapPin, ImageIcon, Bell
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useComplaintStore from "../store/complaintStore";
import api, { getAssetUrl } from "../lib/axios";
import toast from "react-hot-toast";

export default function StaffDashboard() {
  const { user, isAuthenticated, logout, changePassword } = useAuthStore();
  const { complaints, fetchComplaints, updateComplaintStatus } = useComplaintStore();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [dismissedNotifs, setDismissedNotifs] = useState(
    JSON.parse(localStorage.getItem(`dismissedNotifs_${user?._id}`) || '{}')
  );

  const dismissNotif = (e, complaint) => {
    if(e) e.stopPropagation();
    const newDismissed = { ...dismissedNotifs, [complaint._id]: Date.now() };
    setDismissedNotifs(newDismissed);
    localStorage.setItem(`dismissedNotifs_${user?._id}`, JSON.stringify(newDismissed));
  };

  const activeNotifications = complaints.filter(c => {
    const dismissedTime = dismissedNotifs[c._id] || 0;
    const isUpdated = new Date(c.updatedAt).getTime() > dismissedTime;
    return isUpdated && (c.status === 'Pending' || c.hasUnreadForStaff);
  });

  const clearAllNotifs = () => {
    const newDismissed = { ...dismissedNotifs };
    const now = Date.now();
    activeNotifications.forEach(c => {
      newDismissed[c._id] = now;
    });
    setDismissedNotifs(newDismissed);
    localStorage.setItem(`dismissedNotifs_${user?._id}`, JSON.stringify(newDismissed));
    setIsNotificationsOpen(false);
  };
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Modal State
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [resolveModalComplaint, setResolveModalComplaint] = useState(null);
  const [resolveRemarks, setResolveRemarks] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
    }
  }, [isAuthenticated, fetchComplaints]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === "student") return <Navigate to="/student-dashboard" />;

  const handleUpdateStatus = async (id, status) => {
    if (status === "Resolved") {
      const complaint = complaints.find(c => c._id === id);
      if (complaint) {
        setResolveModalComplaint(complaint);
        setResolveRemarks("");
      }
      return;
    }
    await updateComplaintStatus(id, status, `Updated by ${user.name}`);
    if (selectedComplaint && selectedComplaint._id === id) {
      setSelectedComplaint(prev => ({ ...prev, status }));
    }
  };

  const confirmResolveComplaint = async (e) => {
    if(e) e.preventDefault();
    if (!resolveModalComplaint) return;
    try {
      await updateComplaintStatus(resolveModalComplaint._id, "Resolved", resolveRemarks);
      if (resolveRemarks.trim()) {
         await api.post(`/complaints/${resolveModalComplaint._id}/comments`, { text: resolveRemarks, type: 'status_update' });
      }
      if (selectedComplaint && selectedComplaint._id === resolveModalComplaint._id) {
         setSelectedComplaint({...selectedComplaint, status: "Resolved", remarks: resolveRemarks || selectedComplaint.remarks });
      }
      setResolveModalComplaint(null);
      setResolveRemarks("");
      toast.success("Complaint resolved successfully");
      fetchComplaints(); // Refresh the list
    } catch(err) {
      toast.error("Failed to resolve complaint");
    }
  };

  const handleTogglePin = async (complaint) => {
    try {
      const res = await api.put(`/complaints/${complaint._id}/details`, {
        isPinned: !complaint.isPinned
      });
      fetchComplaints();
      if (selectedComplaint && selectedComplaint._id === complaint._id) {
        setSelectedComplaint(prev => ({ ...prev, isPinned: !prev.isPinned }));
      }
      toast.success(complaint.isPinned ? "Complaint unpinned" : "Complaint pinned");
    } catch (error) {
      toast.error("Failed to update pin status");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters long");
    }
    
    const success = await changePassword(currentPassword, newPassword);
    if (success) {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  const handleViewDetails = async (complaint) => {
    setSelectedComplaint(complaint);
    try {
      const res = await api.get(`/complaints/${complaint._id}/comments`);
      setComments(res.data);
    } catch (error) {
      toast.error("Failed to load comments");
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() && commentImages.length === 0) return;
    setIsSubmittingComment(true);
    let uploadedImagePaths = [];
    try {
      if (commentImages.length > 0) {
        const uploadForm = new FormData();
        commentImages.forEach(img => uploadForm.append("images", img));
        const uploadRes = await api.post("/upload", uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImagePaths = uploadRes.data.filePaths;
      }

      const res = await api.post(`/complaints/${selectedComplaint._id}/comments`, {
        text: newComment || "Attached Image",
        isInternal: isInternalComment,
        images: uploadedImagePaths
      });
      setComments([...comments, res.data]);
      setNewComment("");
      setCommentImages([]);
      toast.success("Comment added successfully");
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 24) {
      if (diffHours < 1) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return `${diffMins || 1} min${diffMins > 1 ? 's' : ''} ago`;
      }
      const h = Math.floor(diffHours);
      return `${h} hour${h !== 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getCategoryBadgeClass = (category) => {
    switch (category) {
      case 'Hostel': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Academics': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Library': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'Canteen': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Others': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'In Progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Sorting: Pinned first, then by date
  const sortedComplaints = [...complaints].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#111827]/50 z-40 md:hidden" onClick={closeMobileMenu} />
      )}
      
      {/* Sidebar matching Admin Hub */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#111827] border-r border-slate-800 flex flex-col text-slate-300 shrink-0 shadow-xl transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 tracking-wide">
          <div className="flex items-center">
            <CampusIcon className="h-6 w-6 text-[#FACC15] mr-2" />
            <span className="font-bold text-lg text-white">Staff Portal</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={closeMobileMenu}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 flex-1">
          <nav className="space-y-2">
            <button 
              onClick={() => { setActiveTab("dashboard"); closeMobileMenu(); }} 
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="h-5 w-5" /> Manage Incoming
            </button>
            <button 
              onClick={() => { setActiveTab("profile"); closeMobileMenu(); }} 
              className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'profile' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}
            >
              <Users className="h-5 w-5" /> Account Settings
            </button>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center font-bold">{user?.name?.charAt(0) || 'S'}</div>
              <div className="text-sm truncate">
                <p className="font-medium text-white truncate">{user?.name}</p>
                <p className="text-slate-500 text-xs truncate uppercase tracking-wider">{user?.designation || user?.role} Portal</p>
              </div>
            </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg bg-slate-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium transition-colors">
            <LogOut className="h-4 w-4" /> System Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10 w-full">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="h-5 w-5" />
             </button>
             <h1 className="text-xl font-bold text-slate-800 capitalize hidden sm:block">{activeTab === 'dashboard' ? 'Manage Incoming' : 'Account Settings'}</h1>
          </div>
           <div className="flex items-center gap-4 relative">
             <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full border border-slate-100 shadow-sm">
               <Bell className="h-5 w-5" />
               {activeNotifications.length > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white"></span>}
             </button>
             {isNotificationsOpen && (
               <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 p-4 z-50">
                 <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
                   <h3 className="font-bold text-slate-800">Notifications</h3>
                   {activeNotifications.length > 0 && <button onClick={clearAllNotifs} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">Clear all</button>}
                 </div>
                 <div className="space-y-3">
                   {activeNotifications.slice(0, 5).map(c => (
                     <div key={c._id} className="flex gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer relative group" onClick={() => { setActiveTab('dashboard'); handleViewDetails(c); dismissNotif(null, c); setIsNotificationsOpen(false); }}>
                       <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                         {c.hasUnreadForStaff ? <MessageSquare className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                       </div>
                       <div className="pr-4">
                         <p className="font-medium text-slate-800 line-clamp-1">{c.title}</p>
                         <p className="text-slate-500 text-xs mt-0.5">{c.hasUnreadForStaff ? 'New message' : 'New issue reported'}</p>
                       </div>
                       <button onClick={(e) => dismissNotif(e, c)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Clear notification">
                         <X className="h-3 w-3" />
                       </button>
                     </div>
                   ))}
                   {activeNotifications.length === 0 && <p className="text-sm text-slate-500 text-center py-4">You're all caught up!</p>}
                 </div>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {activeTab === "dashboard" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Assigned Complaints</h1>
                  <p className="text-slate-500 mt-2 text-base">Review, manage, and resolve issues assigned to you.</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1.5">Pending</p>
                    <p className="text-3xl font-extrabold text-slate-900">{complaints.filter(c => c.status === "Pending").length}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                    <Clock className="h-7 w-7" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1.5">In Progress</p>
                    <p className="text-3xl font-extrabold text-slate-900">{complaints.filter(c => c.status === "In Progress").length}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100">
                    <AlertCircle className="h-7 w-7" />
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-1.5">Resolved</p>
                    <p className="text-3xl font-extrabold text-slate-900">{complaints.filter(c => c.status === "Resolved").length}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 border border-emerald-100">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                </div>
              </div>

              {/* Table / List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="font-semibold text-slate-800">Recent Complaints</h3>
                </div>
                
                {/* Mobile List View */}
                <div className="block lg:hidden divide-y divide-slate-100">
                  {sortedComplaints.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">No complaints found.</div>
                  ) : (
                    sortedComplaints.map((c) => (
                      <div key={c._id} className={`p-4 space-y-3 ${c.isPinned ? 'bg-amber-50/30' : ''}`}>
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                            {c.isPinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                            {c.title}
                            {c.priority === 'High' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase">High</span>}
                            {c.priority === 'Medium' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase">Medium</span>}
                            {c.priority === 'Low' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">Low</span>}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                          <span className={`px-2 py-1 rounded-md border ${getCategoryBadgeClass(c.category)}`}>{c.category}</span>
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{c.isAnonymous ? "Anonymous User" : c.student?.name || "Unknown"}</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{formatTime(c.createdAt)}</p>
                        
                        <div className="pt-3 flex flex-col gap-3 border-t border-slate-50">
                          <div className="flex gap-2">
                            <select 
                              className="flex-1 text-xs font-semibold py-2 px-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white cursor-pointer"
                              value={c.status}
                              onChange={(e) => handleUpdateStatus(c._id, e.target.value)}
                            >
                              <option value="Pending">Pending</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                            <button onClick={() => handleTogglePin(c)} className={`p-2 border rounded-lg shadow-sm transition-colors ${c.isPinned ? 'border-primary bg-primary/10 text-primary' : 'border-slate-300 text-slate-500 hover:bg-slate-100'}`}>
                              {c.isPinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                            </button>
                          </div>
                          <button onClick={() => handleViewDetails(c)} className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-lg text-sm font-semibold transition-colors">
                            <Eye className="h-4 w-4" /> View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto min-h-[300px]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Complaint</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedComplaints.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="py-12 text-center text-slate-500 font-medium">No complaints assigned yet.</td>
                        </tr>
                      ) : (
                        sortedComplaints.map((c) => (
                          <tr key={c._id} className={`hover:bg-slate-50/80 transition-colors group ${c.isPinned ? 'bg-amber-50/20' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {c.isPinned && <Pin className="h-4 w-4 text-primary fill-primary shrink-0" />}
                                <p className="text-sm font-bold text-slate-900 truncate" title={c.title}>{c.title}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-700">
                                {c.isAnonymous ? (
                                  <span className="text-slate-500 italic">Anonymous</span>
                                ) : (
                                  c.student?.name || "Unknown User"
                                )}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                               <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border shadow-sm ${getCategoryBadgeClass(c.category)}`}>
                                 {c.category}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                              {c.priority === 'High' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-700 uppercase tracking-wider border border-red-200 shadow-sm">High</span>}
                              {c.priority === 'Medium' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider border border-orange-200 shadow-sm">Medium</span>}
                              {c.priority === 'Low' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200 shadow-sm">Low</span>}
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-medium text-slate-500">{formatTime(c.createdAt)}</p>
                            </td>
                            <td className="px-6 py-4">
                               <select 
                                 className={`text-xs font-bold py-1.5 px-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer transition-colors ${getStatusBadgeClass(c.status)}`}
                                 value={c.status}
                                 onChange={(e) => handleUpdateStatus(c._id, e.target.value)}
                               >
                                 <option value="Pending" className="text-slate-800 bg-white font-medium">Pending</option>
                                 <option value="In Progress" className="text-slate-800 bg-white font-medium">In Progress</option>
                                 <option value="Resolved" className="text-slate-800 bg-white font-medium">Resolved</option>
                               </select>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                 <button onClick={() => handleTogglePin(c)} className={`p-2 rounded-lg transition-colors ${c.isPinned ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`} title={c.isPinned ? "Unpin Complaint" : "Pin Complaint"}>
                                   {c.isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                                 </button>
                                 <button onClick={() => handleViewDetails(c)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                                   <Eye className="h-5 w-5" />
                                 </button>
                               </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-3xl">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 mt-2 text-base">Manage your profile information and account security.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Profile Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Full Name</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">
                        {user?.name}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email Address</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">
                        {user?.email}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Role / Designation</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium capitalize">
                        {user?.designation || user?.role}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Department</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">
                        {user?.department || "N/A"}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-6 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> To update these details, please contact the system administrator.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Change Password</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                      <input 
                        type="password" 
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all text-sm outline-none"
                        placeholder="Enter current password"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                        <input 
                          type="password" 
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all text-sm outline-none"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm New Password</label>
                        <input 
                          type="password" 
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] transition-all text-sm outline-none"
                          placeholder="Confirm new password"
                        />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button 
                        type="submit"
                        className="bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all"
                      >
                        Update Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>

      {/* View Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Complaint Details
              </h2>
              <div className="flex items-center gap-2">
                <button onClick={() => handleTogglePin(selectedComplaint)} className={`p-2 rounded-full transition-colors ${selectedComplaint.isPinned ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`} title={selectedComplaint.isPinned ? "Unpin Complaint" : "Pin Complaint"}>
                  {selectedComplaint.isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                </button>
                <button onClick={() => setSelectedComplaint(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Left Column: Info */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-100 space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight flex items-center gap-2">
                    {selectedComplaint.isPinned && <Pin className="h-5 w-5 text-primary fill-primary shrink-0" />}
                    {selectedComplaint.title}
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getCategoryBadgeClass(selectedComplaint.category)}`}>{selectedComplaint.category}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(selectedComplaint.status)}`}>{selectedComplaint.status}</span>
                  </div>
                  
                  {/* Location field */}
                  <div className="flex items-start gap-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                      <p className="text-sm font-semibold text-slate-800">{selectedComplaint.location || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p>
                    <p className="text-sm font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedComplaint.description}</p>
                  </div>

                  {/* Images if available */}
                  {selectedComplaint.images && selectedComplaint.images.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Attached Media ({selectedComplaint.images.length})</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedComplaint.images.map((img, idx) => (
                          <a key={idx} href={getAssetUrl(img)} target="_blank" rel="noopener noreferrer" className="h-20 w-20 rounded-lg overflow-hidden border border-slate-200 hover:opacity-80 transition-opacity">
                            <img src={getAssetUrl(img)} alt="Evidence" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Student</p>
                    <p className="text-sm font-bold text-slate-800">
                      {selectedComplaint.isAnonymous ? "Anonymous User" : (selectedComplaint.student?.name || "Unknown User")}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-sm font-bold text-slate-800">{formatTime(selectedComplaint.createdAt)}</p>
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Change Status</label>
                   <select 
                     className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm font-bold text-slate-800 cursor-pointer shadow-sm"
                     value={selectedComplaint.status}
                     onChange={(e) => handleUpdateStatus(selectedComplaint._id, e.target.value)}
                   >
                     <option value="Pending">Pending</option>
                     <option value="In Progress">In Progress</option>
                     <option value="Resolved">Resolved</option>
                   </select>
                </div>
              </div>

              {/* Right Column: Comments */}
              <div className="w-full md:w-1/2 flex flex-col bg-slate-50/30">
                 <div className="px-6 py-4 border-b border-slate-100 bg-white">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Communications & Notes</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
                   {comments.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                       <MessageSquare className="h-8 w-8 opacity-20" />
                       <p className="text-sm font-medium">No comments yet</p>
                     </div>
                   ) : (
                     comments.map(comment => (
                       <div key={comment._id} className={`flex flex-col ${comment.user?._id === user._id ? 'items-end' : 'items-start'}`}>
                         <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${comment.user?._id === user._id ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'} ${comment.isInternal ? 'ring-2 ring-amber-400/50 relative' : ''}`}>
                            {comment.isInternal && (
                              <div className="absolute -top-2.5 -right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-sm">
                                <Lock className="h-3 w-3" /> Internal Note
                              </div>
                            )}
                            <p className="text-sm font-medium leading-relaxed mt-1">{comment.text}</p>
                            {comment.images && comment.images.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {comment.images.map((img, idx) => (
                                  <a key={idx} href={getAssetUrl(img)} target="_blank" rel="noreferrer" className="h-16 w-16 rounded-md overflow-hidden border border-slate-200 block hover:opacity-80 transition-opacity">
                                    <img src={getAssetUrl(img)} alt="Attached" className="w-full h-full object-cover" />
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className={`text-[10px] mt-2 font-medium flex justify-between gap-4 ${comment.user?._id === user._id ? 'text-white/70' : 'text-slate-400'}`}>
                              <span>{comment.user?.name} ({comment.user?.role})</span>
                              <span>{formatTime(comment.createdAt)}</span>
                            </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>

                 <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                       <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 group">
                             <input type="checkbox" checked={isInternalComment} onChange={e => setIsInternalComment(e.target.checked)} className="rounded border-slate-300 text-[#FACC15] focus:ring-[#FACC15] h-4 w-4 transition-all" />
                             <span className="group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                               <Lock className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" /> Internal Note (Admin/Staff only)
                             </span>
                          </label>
                       </div>
                       <div className="relative">
                          <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder={isInternalComment ? "Type an internal note..." : "Type a public message..."}
                            className="w-full pl-4 pr-24 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] text-sm shadow-sm transition-all"
                          />
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <label className="p-2 text-slate-400 hover:text-[#FACC15] cursor-pointer transition-colors" title="Attach Image">
                              <ImageIcon className="h-4 w-4" />
                              <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setCommentImages(Array.from(e.target.files))} />
                            </label>
                            <button 
                              type="submit" 
                              disabled={(!newComment.trim() && commentImages.length === 0) || isSubmittingComment}
                              className="p-2 bg-[#FACC15] text-slate-900 rounded-lg hover:bg-[#EAB308] disabled:opacity-50 transition-all active:scale-95"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                       </div>
                       {commentImages.length > 0 && (
                         <div className="flex gap-2 flex-wrap mt-1">
                           {commentImages.map((img, idx) => (
                             <div key={idx} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded truncate max-w-[100px]">{img.name}</div>
                           ))}
                           <button type="button" onClick={() => setCommentImages([])} className="text-[10px] text-red-500 hover:underline">Clear</button>
                         </div>
                       )}
                    </form>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Complaint Modal */}
      {resolveModalComplaint && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative">
            <button onClick={() => setResolveModalComplaint(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Resolve Complaint</h2>
            <p className="text-sm text-slate-500 mb-6">You are about to mark this complaint as resolved. Please provide an optional final comment summarizing the resolution.</p>
            <form onSubmit={confirmResolveComplaint}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">Final Remarks (Optional)</label>
                <textarea 
                  rows={3} 
                  value={resolveRemarks} 
                  onChange={e => setResolveRemarks(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl focus:ring-[#FACC15] focus:border-[#FACC15] bg-white text-sm outline-none resize-none"
                  placeholder="e.g. The issue has been fixed by replacing the router."
                />
                <p className="text-xs text-slate-400 mt-2 text-right">This message will be visible to the student and staff.</p>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setResolveModalComplaint(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Mark as Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
