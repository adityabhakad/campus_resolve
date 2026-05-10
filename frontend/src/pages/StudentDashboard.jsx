import CampusIcon from "../components/CampusIcon";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  LayoutDashboard, FileText, Settings, LogOut, Plus, 
  Bell, Search, CheckCircle2, Clock, AlertCircle,
  MapPin, Image as ImageIcon, Menu, X, ShieldCheck,
  KeyRound, User, Calendar, ChevronDown, Eye, MessageSquare, Send
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useComplaintStore from "../store/complaintStore";
import api, { getAssetUrl } from "../lib/axios";
import toast from "react-hot-toast";
import * as exifr from "exifr";

export default function StudentDashboard() {
  const { user, isAuthenticated, logout, changePassword } = useAuthStore();
  const { complaints, fetchComplaints, addComplaint } = useComplaintStore();
  
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [formData, setFormData] = useState({
    title: "", description: "", category: "Hostel", location: "", gpsCoordinates: null, isAnonymous: false
  });

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const categories = [
    "Hostel", "Academics", "Library", "Canteen", "Others"
  ];

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [dismissedNotifs, setDismissedNotifs] = useState(
    JSON.parse(localStorage.getItem(`dismissedNotifs_${user?._id}`) || '{}')
  );

  const dismissNotif = (e, complaint) => {
    if(e) e.stopPropagation();
    const newDismissed = { ...dismissedNotifs, [complaint._id]: Date.now() };
    setDismissedNotifs(newDismissed);
    localStorage.setItem(`dismissedNotifs_${user?._id}`, JSON.stringify(newDismissed));
  };

  useEffect(() => {
    if (isAuthenticated) fetchComplaints();
  }, [isAuthenticated, fetchComplaints]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      return toast.error("Maximum 5 images allowed.");
    }

    const validFiles = files.filter(f => {
      const isValidType = ["image/jpeg", "image/png", "image/jpg"].includes(f.type);
      const isValidSize = f.size <= 5 * 1024 * 1024;
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast.error("Some files were rejected. Only JPG/PNG under 5MB are allowed.");
    }

    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setImages(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...newPreviews]);

    if (validFiles.length > 0 && !formData.gpsCoordinates) {
      try {
        const file = validFiles[0];
        const gps = await exifr.gps(file);
        if (gps && gps.latitude != null && gps.longitude != null) {
          setFormData(prev => ({ 
            ...prev, 
            gpsCoordinates: { lat: gps.latitude, lng: gps.longitude },
            location: prev.location || `GPS Auto-Detected: ${gps.latitude.toFixed(4)}, ${gps.longitude.toFixed(4)}`
          }));
          toast.success("GPS location extracted from image!");
        }
      } catch (err) {
        console.warn("No EXIF GPS found in image");
      }
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location.trim()) {
      return toast.error("Please provide a location.");
    }

    setIsSubmitting(true);
    let uploadedImagePaths = [];

    if (images.length > 0) {
      const uploadForm = new FormData();
      images.forEach(img => uploadForm.append("images", img));
      
      try {
        const uploadRes = await api.post("/upload", uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImagePaths = uploadRes.data.filePaths;
      } catch (error) {
        setIsSubmitting(false);
        return toast.error("Image upload failed. Please try again.");
      }
    }

    const payload = { ...formData, images: uploadedImagePaths };
    const success = await addComplaint(payload);
    
    setIsSubmitting(false);
    if (success) {
      toast.success("Complaint logged successfully!");
      setIsModalOpen(false);
      setFormData({ title: "", description: "", category: "Hostel", location: "", gpsCoordinates: null, isAnonymous: false });
      setImages([]);
      setImagePreviews([]);
      setActiveTab("complaints");
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
    
    setIsChangingPassword(true);
    const success = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    
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
      fetchComplaints(); // to refresh unread status locally if needed
    } catch (error) {
      toast.error("Failed to load messages");
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
        images: uploadedImagePaths
      });
      setComments([...comments, res.data]);
      setNewComment("");
      setCommentImages([]);
      toast.success("Message sent");
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const myComplaints = complaints.filter(c => c.student?._id === user?._id);

  const activeNotifications = myComplaints.filter(c => {
    const dismissedTime = dismissedNotifs[c._id] || 0;
    const isUpdated = new Date(c.updatedAt).getTime() > dismissedTime;
    return isUpdated && (c.status === 'Resolved' || c.hasUnreadForStudent);
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

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === "admin") return <Navigate to="/admin-dashboard" />;
  if (["staff", "warden", "faculty", "librarian", "canteen_manager"].includes(user?.role)) return <Navigate to="/staff-dashboard" />;


  const filteredComplaints = myComplaints.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#111827]/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      {/* Sidebar matching Admin */}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#111827] border-r border-slate-800 flex flex-col text-slate-300 shrink-0 shadow-xl transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 tracking-wide">
          <div className="flex items-center">
            <CampusIcon className="h-6 w-6 text-[#FACC15] mr-2" />
            <span className="font-bold text-lg text-white">Student Portal</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 flex-1">
          <nav className="space-y-2">
            <button onClick={() => {setActiveTab("dashboard"); setIsMobileMenuOpen(false);}} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="h-5 w-5" /> Overview
            </button>
            <button onClick={() => {setActiveTab("complaints"); setIsMobileMenuOpen(false);}} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'complaints' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <FileText className="h-5 w-5" /> My History
            </button>
            <button onClick={() => {setActiveTab("settings"); setIsMobileMenuOpen(false);}} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'settings' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Settings className="h-5 w-5" /> Account Settings
            </button>
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button onClick={() => setIsModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl text-white hover:bg-slate-800 transition-colors border border-slate-700">
                <Plus className="h-5 w-5" /> Report Issue
              </button>
            </div>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center font-bold">{user?.name?.charAt(0) || 'S'}</div>
              <div className="text-sm truncate">
                <p className="font-medium text-white truncate">{user?.name}</p>
                <p className="text-slate-500 text-xs truncate uppercase tracking-wider">{user?.role} Portal</p>
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
             <h1 className="text-xl font-bold text-slate-800 capitalize hidden sm:block">{activeTab === 'dashboard' ? 'Overview' : activeTab === 'complaints' ? 'My History' : 'Account Settings'}</h1>
          </div>
           <div className="flex items-center gap-4 relative">
             <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full border border-slate-100">
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
                     <div key={c._id} className="flex gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer relative group" onClick={() => { handleViewDetails(c); dismissNotif(null, c); setIsNotificationsOpen(false); }}>
                       <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${c.hasUnreadForStudent ? 'bg-blue-100 text-primary' : 'bg-emerald-100 text-emerald-600'}`}>
                         {c.hasUnreadForStudent ? <MessageSquare className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                       </div>
                       <div className="pr-4">
                         <p className="font-medium text-slate-800 line-clamp-1">{c.title}</p>
                         <p className="text-slate-500 text-xs mt-0.5">{c.hasUnreadForStudent ? 'New message from staff' : 'Has been resolved'}</p>
                       </div>
                       <button onClick={(e) => dismissNotif(e, c)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" title="Clear notification">
                         <X className="h-3 w-3" />
                       </button>
                     </div>
                   ))}
                   {activeNotifications.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No recent updates.</p>}
                 </div>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300 max-w-7xl mx-auto">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
                <p className="text-slate-500 mt-2 text-base">Here's your campus request overview.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div><p className="text-sm font-medium text-slate-500 mb-1.5">Pending Review</p><p className="text-3xl font-extrabold text-slate-900">{myComplaints.filter(c => c.status === "Pending").length}</p></div>
                  <div className="h-14 w-14 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"><Clock className="h-7 w-7" /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div><p className="text-sm font-medium text-slate-500 mb-1.5">In Progress</p><p className="text-3xl font-extrabold text-slate-900">{myComplaints.filter(c => c.status === "In Progress").length}</p></div>
                  <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-primary group-hover:scale-110 transition-transform"><AlertCircle className="h-7 w-7" /></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                  <div><p className="text-sm font-medium text-slate-500 mb-1.5">Resolved</p><p className="text-3xl font-extrabold text-slate-900">{myComplaints.filter(c => c.status === "Resolved").length}</p></div>
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform"><CheckCircle2 className="h-7 w-7" /></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                  <button onClick={() => setActiveTab('complaints')} className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">View All</button>
                </div>
                <div className="p-0">
                  {myComplaints.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <CheckCircle2 className="h-8 w-8 text-slate-300" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">No active complaints</h3>
                      <p className="text-slate-500 text-sm">Everything seems to be running smoothly.</p>
                      <button onClick={() => setIsModalOpen(true)} className="mt-6 font-bold text-white bg-primary hover:bg-blue-700 px-6 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"><Plus className="h-4 w-4"/> Report an issue</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {myComplaints.slice(0, 5).map((complaint) => (
                        <div key={complaint._id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                          <div className={`p-3 rounded-xl shrink-0 ${complaint.status === 'Resolved' ? 'bg-emerald-100 text-emerald-600' : complaint.status === 'In Progress' ? 'bg-blue-100 text-primary' : 'bg-orange-100 text-orange-600'}`}>
                            {complaint.status === 'Resolved' ? <CheckCircle2 className="h-5 w-5" /> : complaint.status === 'In Progress' ? <Clock className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center mb-1 gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <h4 className="text-base font-bold text-slate-900 truncate">{complaint.title}</h4>
                                {complaint.priority === 'High' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase shrink-0">High</span>}
                                {complaint.priority === 'Medium' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase shrink-0">Medium</span>}
                                {complaint.priority === 'Low' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase shrink-0">Low</span>}
                              </div>
                              <span className="text-xs font-medium text-slate-400 shrink-0">{new Date(complaint.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-1 mb-2">{complaint.description}</p>
                            <div className="flex gap-2">
                              <span className="inline-flex px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">{complaint.category}</span>
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : complaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{complaint.status}</span>
                            </div>
                            <button onClick={() => handleViewDetails(complaint)} className="mt-3 text-sm font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                              <Eye className="h-4 w-4" /> View Details & Chat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMPLAINTS HISTORY TAB */}
          {activeTab === "complaints" && (
            <div className="animate-in fade-in duration-300 max-w-7xl mx-auto h-full flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My History</h1>
                  <p className="text-slate-500 mt-2 text-base">A complete record of all the issues you've reported.</p>
                </div>
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder="Search complaints..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredComplaints.length === 0 ? (
                  <div className="col-span-full bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center flex flex-col items-center">
                    <Search className="h-12 w-12 text-slate-200 mb-4" />
                    <p className="text-lg font-medium text-slate-700">No complaints found</p>
                  </div>
                ) : (
                  filteredComplaints.map(complaint => (
                    <div key={complaint._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                       <div className="p-6 border-b border-slate-100 flex-1">
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : complaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                              {complaint.status}
                            </span>
                            <span className="text-xs font-medium text-slate-500">
                              {new Date(complaint.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="text-lg font-bold text-slate-900 line-clamp-2">{complaint.title}</h4>
                            {complaint.priority === 'High' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 uppercase shrink-0">High</span>}
                            {complaint.priority === 'Medium' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 uppercase shrink-0">Medium</span>}
                            {complaint.priority === 'Low' && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase shrink-0">Low</span>}
                          </div>
                          <p className="text-sm text-slate-500 line-clamp-3 mb-4">{complaint.description}</p>
                       </div>
                       <div className="p-4 bg-slate-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-500">
                             <MapPin className="h-4 w-4" />
                             <span className="text-xs font-medium truncate max-w-[150px]">{complaint.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex px-2 py-1 rounded text-xs font-medium bg-white border border-slate-200 text-slate-600 shadow-sm">
                              {complaint.category}
                            </span>
                            <button onClick={() => handleViewDetails(complaint)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View Details">
                              <Eye className="h-4 w-4" />
                            </button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-300 max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Account Settings</h1>
                <p className="text-slate-500 mt-2 text-base">Manage your personal information and account security.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Profile Information</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Full Name</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">{user?.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Email Address</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">{user?.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-1.5">Role</label>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium capitalize">{user?.role}</div>
                    </div>
                    {(user?.rollNumber || user?.department) && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-600 mb-1.5">Department / ID</label>
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-900 font-medium">{user?.department || user?.rollNumber}</div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-6 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4" /> To update these details, please contact the campus administration desk.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <h3 className="font-bold text-slate-800">Change Password</h3>
                </div>
                <div className="p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Current Password</label>
                      <input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all text-sm" placeholder="Enter current password" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                        <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all text-sm" placeholder="Min 6 characters" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                        <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#FACC15] focus:border-[#FACC15] outline-none transition-all text-sm" placeholder="Confirm new password" />
                      </div>
                    </div>
                    <div className="pt-2 flex justify-end">
                      <button type="submit" disabled={isChangingPassword} className="bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50">
                        {isChangingPassword ? "Updating..." : "Update Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Report Issue Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#111827]/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center rounded-t-2xl">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Report an Issue</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors border border-slate-200 bg-white shadow-sm">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Complaint Title <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none text-sm" placeholder="e.g. Broken AC in Lab" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Category <span className="text-red-500">*</span></label>
                    <div className="relative">
                       <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none text-sm appearance-none bg-white">
                         {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                       </select>
                       <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Location <span className="text-red-500">*</span></label>
                    <input required type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none text-sm" placeholder="e.g. A-Block, Room 302" />
                    {formData.gpsCoordinates && <p className="text-[10px] text-emerald-600 font-bold mt-1">✓ Auto-tagged via image GPS</p>}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
                  <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#FACC15] outline-none text-sm resize-none" placeholder="Describe the issue..." />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-sm font-bold text-slate-700">Photographic Evidence</label>
                    <span className="text-xs text-slate-500">{images.length}/5</span>
                  </div>
                  
                  <div className="border-2 border-slate-300 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors p-4 flex flex-col items-center justify-center text-center">
                    <ImageIcon className="h-8 w-8 text-slate-400 mb-2" />
                    <label className="cursor-pointer text-[#FACC15] font-bold text-sm">
                      Click to upload images
                      <input type="file" className="sr-only" multiple accept=".jpg,.jpeg,.png" onChange={handleImageUpload} disabled={images.length >= 5} />
                    </label>
                  </div>

                  {imagePreviews.length > 0 && (
                    <div className="mt-3 grid grid-cols-4 sm:grid-cols-5 gap-3">
                      {imagePreviews.map((src, index) => (
                        <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                          <img src={src} alt="preview" className="object-cover w-full h-full" />
                          <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-white/90 text-red-500 rounded-full p-1 hover:bg-red-500 hover:text-white shadow-sm opacity-0 group-hover:opacity-100 transition-all">
                             <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={formData.isAnonymous} onChange={e => setFormData({...formData, isAnonymous: e.target.checked})} className="mt-1 h-4 w-4 rounded border-slate-300 text-[#FACC15] focus:ring-[#FACC15]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800">Submit Anonymously</span>
                      <span className="text-xs text-slate-500">Your identity will be hidden from staff members.</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl bg-white">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-5 py-2 text-sm font-bold text-slate-900 bg-[#FACC15] hover:bg-[#EAB308] rounded-lg disabled:opacity-70 flex items-center gap-2">
                {isSubmitting ? "Submitting..." : "Submit Complaint"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Details / Chat Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Complaint Details
              </h2>
              <button onClick={() => setSelectedComplaint(null)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
              {/* Left Column: Info */}
              <div className="w-full md:w-1/2 p-6 border-b md:border-b-0 md:border-r border-slate-100 space-y-6">
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-2 leading-tight">{selectedComplaint.title}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">{selectedComplaint.category}</span>
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider border ${selectedComplaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : selectedComplaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{selectedComplaint.status}</span>
                  </div>
                  
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
              </div>

              {/* Right Column: Comments */}
              <div className="w-full md:w-1/2 flex flex-col bg-slate-50/30">
                 <div className="px-6 py-4 border-b border-slate-100 bg-white">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" /> Chat with Staff</h3>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
                   {comments.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
                       <MessageSquare className="h-8 w-8 opacity-20" />
                       <p className="text-sm font-medium">No messages yet</p>
                     </div>
                   ) : (
                     comments.map(comment => (
                       <div key={comment._id} className={`flex flex-col ${comment.user?._id === user._id ? 'items-end' : 'items-start'}`}>
                         <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${comment.user?._id === user._id ? 'bg-primary text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                            <p className="text-sm font-medium leading-relaxed">{comment.text}</p>
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
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>

                 <div className="p-4 bg-white border-t border-slate-100">
                    <form onSubmit={handleAddComment} className="flex flex-col gap-3">
                       <div className="relative">
                          <input 
                            type="text" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Type a message..."
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
    </div>
  );
}
