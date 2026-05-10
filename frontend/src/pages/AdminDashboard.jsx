import CampusIcon from "../components/CampusIcon";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, LogOut, CheckCircle2, AlertCircle, Clock, 
  Plus, Search, Filter, MessageSquare, Bell, Image as ImageIcon,
  Trash2, X, ClipboardList, Eye, Pencil, Play, AlertTriangle, Send, Pin, AlertOctagon, Menu, Lock
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useComplaintStore from "../store/complaintStore";
import api, { getAssetUrl } from "../lib/axios";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, AreaChart, Area
} from "recharts";

const STATUS_COLORS = ['#f59e0b', '#3b82f6', '#10b981']; 

export default function AdminDashboard() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { complaints, fetchComplaints, assignStaff, updateComplaintStatus, deleteComplaint, updateComplaintDetails } = useComplaintStore();

  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [editModalComplaint, setEditModalComplaint] = useState(null);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [dismissedNotifs, setDismissedNotifs] = useState({});

  useEffect(() => {
    if (user?._id) {
      setDismissedNotifs(JSON.parse(localStorage.getItem(`dismissedNotifs_${user._id}`) || '{}'));
    }
  }, [user?._id]);

  const [resolveModalComplaint, setResolveModalComplaint] = useState(null);
  const [resolveRemarks, setResolveRemarks] = useState("");

  const dismissNotif = (e, complaint) => {
    if(e) e.stopPropagation();
    const newDismissed = { ...dismissedNotifs, [complaint._id]: Date.now() };
    setDismissedNotifs(newDismissed);
    localStorage.setItem(`dismissedNotifs_${user?._id}`, JSON.stringify(newDismissed));
  };

  const activeNotifications = complaints.filter(c => {
    const dismissedTime = dismissedNotifs[c._id] || 0;
    const isUpdated = new Date(c.updatedAt).getTime() > dismissedTime;
    return isUpdated && (c.status === 'Pending' || c.hasUnreadForStaff || c.hasUnreadForAdmin);
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
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCategory, setFilterCategory] = useState("All");

  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [staffData, setStaffData] = useState({
    name: "", email: "", password: "", staffId: "", role: "staff", isActive: true
  });

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for(let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setStaffData({...staffData, password: pwd});
  };

  // Comments / Messaging State
  const [comments, setComments] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [commentImages, setCommentImages] = useState([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isInternalComment, setIsInternalComment] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchComplaints();
      fetchAllUsers();
    }
  }, [isAuthenticated, fetchComplaints]);

  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await api.get("/auth/users");
      setUsers(res.data);
    } catch (err) {
      toast.error("Failed to load users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post("/auth/staff", staffData);
      toast.success("Account provisioned successfully!");
      setIsStaffModalOpen(false);
      setStaffData({ name: "", email: "", password: "", staffId: "", role: "staff", isActive: true });
      fetchAllUsers(); 
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to create staff account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/auth/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (currentStatus === true) {
      if (!window.confirm("Are you sure you want to deactivate this user? They will be blocked from logging in.")) return;
    }
    try {
      const res = await api.put(`/auth/users/${userId}/status`, { isActive: !currentStatus });
      setUsers(users.map(u => u._id === userId ? res.data : u));
      if (selectedUserForModal && selectedUserForModal._id === userId) {
        setSelectedUserForModal(res.data);
      }
      toast.success(res.data.isActive ? "User activated" : "User deactivated");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    }
  };

  const handleAssignStaff = async (complaintId, staffId) => {
    if (!staffId) return;
    await assignStaff(complaintId, staffId);
  };

  const handleStatusChangeAction = async (complaint, newStatus) => {
    if (newStatus === "Resolved" && !complaint.assignedTo) {
      toast.error("Cannot resolve an unassigned complaint. Please assign staff first.");
      return;
    }
    
    if (newStatus === "Resolved") {
      setResolveModalComplaint(complaint);
      setResolveRemarks("");
      return;
    } else {
      if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    }

    await updateComplaintStatus(complaint._id, newStatus, "");
    if (selectedComplaint && selectedComplaint._id === complaint._id) {
       setSelectedComplaint({...selectedComplaint, status: newStatus});
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
    } catch(err) {
      toast.error("Failed to resolve complaint");
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const openComplaintModal = async (complaint) => {
    setSelectedComplaint(complaint);
    setComments([]);
    try {
      const res = await api.get(`/complaints/${complaint._id}/comments`);
      setComments(res.data);
    } catch (err) {
      toast.error("Failed to load discussion timeline");
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && commentImages.length === 0) return;
    try {
      setIsUploadingImage(true);
      let uploadedImagePaths = [];
      if (commentImages.length > 0) {
        const uploadForm = new FormData();
        commentImages.forEach(img => uploadForm.append("images", img));
        const uploadRes = await api.post("/upload", uploadForm, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        uploadedImagePaths = uploadRes.data.filePaths;
      }

      const res = await api.post(`/complaints/${selectedComplaint._id}/comments`, { 
        text: newMessage || "Attached Image", 
        isInternal: isInternalComment,
        images: uploadedImagePaths
      });
      setComments([...comments, res.data]);
      setNewMessage("");
      setCommentImages([]);
    } catch (err) {
      toast.error("Failed to post message");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete this resolved complaint? This cannot be undone.")) return;
    const success = await deleteComplaint(id);
    if (success) {
       setEditModalComplaint(null);
       if (selectedComplaint && selectedComplaint._id === id) setSelectedComplaint(null);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const success = await updateComplaintDetails(editModalComplaint._id, {
      priority: editModalComplaint.priority,
      isPinned: editModalComplaint.isPinned
    });
    if (success) {
      setEditModalComplaint(null);
    }
  };

  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== "admin") return <Navigate to={["staff", "warden", "faculty", "librarian", "canteen_manager"].includes(user?.role) ? "/staff-dashboard" : "/student-dashboard"} />;

  const staffMembers = users.filter(u => ["staff", "warden", "faculty", "librarian", "canteen_manager"].includes(u.role));
  
  let filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.student?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "All" || c.status === filterStatus;
    const matchesCategory = filterCategory === "All" || c.category === filterCategory;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  filteredComplaints.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const categoryDataMap = {
    'Academics': { name: 'Academics', count: 0, Pending: 0, InProgress: 0, Resolved: 0 },
    'Hostel': { name: 'Hostel', count: 0, Pending: 0, InProgress: 0, Resolved: 0 },
    'Library': { name: 'Library', count: 0, Pending: 0, InProgress: 0, Resolved: 0 },
    'Canteen': { name: 'Canteen', count: 0, Pending: 0, InProgress: 0, Resolved: 0 },
    'Others': { name: 'Others', count: 0, Pending: 0, InProgress: 0, Resolved: 0 }
  };
  
  complaints.forEach(c => {
    let cat = categoryDataMap[c.category] ? c.category : 'Others';
    categoryDataMap[cat].count += 1;
    if (c.status === 'In Progress') {
      categoryDataMap[cat].InProgress += 1;
    } else {
      categoryDataMap[cat][c.status] = (categoryDataMap[cat][c.status] || 0) + 1;
    }
  });

  const categoryChartData = [
    categoryDataMap['Academics'],
    categoryDataMap['Hostel'],
    categoryDataMap['Library'],
    categoryDataMap['Canteen'],
    categoryDataMap['Others']
  ];

  const CustomCategoryTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white text-slate-800 p-4 rounded-xl shadow-2xl border border-slate-100 text-sm w-56 z-50 relative">
          <p className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">{data.name} Analytics</p>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-slate-500 font-medium">Total Complaints</span>
            <span className="font-bold text-slate-900 text-base">{data.count}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-emerald-500 font-medium">Resolved</span>
            <span className="font-bold">{data.Resolved}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-blue-500 font-medium">In Progress</span>
            <span className="font-bold">{data.InProgress}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-orange-500 font-medium">Pending</span>
            <span className="font-bold">{data.Pending}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const statusChartData = [
    { name: 'Pending', value: complaints.filter(c => c.status === "Pending").length },
    { name: 'In Progress', value: complaints.filter(c => c.status === "In Progress").length },
    { name: 'Resolved', value: complaints.filter(c => c.status === "Resolved").length },
  ];

  const timelineDataMap = {};
  complaints.forEach(c => {
    const dateStr = new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!timelineDataMap[dateStr]) {
      timelineDataMap[dateStr] = { date: dateStr, count: 0, Academics: 0, Hostel: 0, Library: 0, Canteen: 0, Others: 0 };
    }
    timelineDataMap[dateStr].count += 1;
    let cat = ['Academics', 'Hostel', 'Library', 'Canteen'].includes(c.category) ? c.category : 'Others';
    timelineDataMap[dateStr][cat] += 1;
  });
  const timelineData = Object.values(timelineDataMap).reverse();

  const CustomTimelineTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white text-slate-800 p-4 rounded-xl shadow-2xl border border-slate-100 text-sm w-56 z-50 relative">
          <p className="font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">{data.date}</p>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-slate-500 font-medium">Total Complaints</span>
            <span className="font-bold text-slate-900 text-base">{data.count}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-purple-500 font-medium">Academics</span>
            <span className="font-bold">{data.Academics}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-pink-500 font-medium">Hostel</span>
            <span className="font-bold">{data.Hostel}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-cyan-500 font-medium">Library</span>
            <span className="font-bold">{data.Library}</span>
          </div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-yellow-500 font-medium">Canteen</span>
            <span className="font-bold">{data.Canteen}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sky-500 font-medium">Others</span>
            <span className="font-bold">{data.Others}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#111827]/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      <aside className={`fixed md:relative z-50 w-64 h-full bg-[#111827] border-r border-slate-800 flex flex-col text-slate-300 shrink-0 shadow-xl transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 tracking-wide">
          <div className="flex items-center">
            <CampusIcon className="h-6 w-6 text-[#FACC15] mr-2" />
            <span className="font-bold text-lg text-white">Admin Hub</span>
          </div>
          <button className="md:hidden text-slate-400 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 flex-1">
          <nav className="space-y-2">
            <button onClick={() => setActiveTab("dashboard")} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'dashboard' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <LayoutDashboard className="h-5 w-5" /> Analytics
            </button>
            <button onClick={() => setActiveTab("complaints")} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'complaints' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <ClipboardList className="h-5 w-5" /> Complaints
            </button>
            <button onClick={() => setActiveTab("staffs")} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'staffs' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Users className="h-5 w-5" /> Staff Management
            </button>
            <button onClick={() => setActiveTab("students")} className={`flex items-center gap-3 px-4 py-3 w-full rounded-xl font-medium transition-all ${activeTab === 'students' ? 'bg-[#FACC15] text-slate-900 shadow-lg shadow-[#FACC15]/20' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Users className="h-5 w-5" /> Student Management
            </button>
            
            <div className="pt-4 mt-4 border-t border-slate-800">
              <button onClick={() => setIsStaffModalOpen(true)} className="flex items-center justify-center gap-2 px-4 py-3 w-full rounded-xl text-white hover:bg-slate-800 transition-colors border border-slate-700">
                <Plus className="h-5 w-5" /> Add Staff Member
              </button>
            </div>
          </nav>
        </div>
        <div className="p-4 border-t border-slate-800">
           <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-10 w-10 rounded-full bg-[#FACC15]/20 text-[#FACC15] flex items-center justify-center font-bold">{user?.name?.charAt(0) || 'A'}</div>
              <div className="text-sm truncate">
                <p className="font-medium text-white truncate">{user?.name}</p>
                <p className="text-slate-500 text-xs truncate">{user?.email}</p>
              </div>
            </div>
          <button onClick={logout} className="flex items-center justify-center gap-2 px-3 py-2.5 w-full rounded-lg bg-slate-800/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-medium transition-colors">
            <LogOut className="h-4 w-4" /> System Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative w-full">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0 shadow-sm z-10 w-full">
          <div className="flex items-center gap-3">
             <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
                <Menu className="h-5 w-5" />
             </button>
             <h1 className="text-xl font-bold text-slate-800 capitalize hidden sm:block">{activeTab}</h1>
          </div>
          <div className="flex items-center gap-4 relative">
             <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 rounded-full">
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
                     <div key={c._id} className="flex gap-3 text-sm p-2 rounded-lg hover:bg-slate-50 cursor-pointer relative group" onClick={() => { setActiveTab('complaints'); openComplaintModal(c); dismissNotif(null, c); setIsNotificationsOpen(false); }}>
                       <div className="h-8 w-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                         {(c.hasUnreadForStaff || c.hasUnreadForAdmin) ? <MessageSquare className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                       </div>
                       <div className="pr-4">
                         <p className="font-medium text-slate-800 line-clamp-1">{c.title}</p>
                         <p className="text-slate-500 text-xs mt-0.5">{(c.hasUnreadForStaff || c.hasUnreadForAdmin) ? 'New message' : 'Needs assignment'}</p>
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
          
          {/* DASHBOARD TAB */}
          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard title="Total Complaints" value={complaints.length} icon={<LayoutDashboard />} color="text-slate-600" bg="bg-slate-100" />
                <StatCard title="Resolved" value={statusChartData[2].value} icon={<CheckCircle2 />} color="text-green-600" bg="bg-green-100" />
                <StatCard title="In Progress" value={statusChartData[1].value} icon={<Clock />} color="text-primary" bg="bg-blue-100" />
                <StatCard title="Pending Review" value={statusChartData[0].value} icon={<AlertCircle />} color="text-orange-600" bg="bg-orange-100" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Complaint Timeline</h3>
                   <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={20} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} content={<CustomTimelineTooltip />} />
                          <Area type="monotone" dataKey="count" name="Complaints" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{r: 6, strokeWidth: 0, fill: '#8b5cf6'}} />
                        </AreaChart>
                      </ResponsiveContainer>
                   </div>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                   <h3 className="text-lg font-bold text-slate-800 mb-6">Volume by Category</h3>
                   <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryChartData} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }} barSize={32}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 13, fontWeight: 600}} width={80} />
                          <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomCategoryTooltip />} />
                          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                            {categoryChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#ec4899' : index === 2 ? '#f59e0b' : index === 3 ? '#10b981' : '#0ea5e9'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                 </div>
              </div>

               <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                 <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h3>
                 <div className="space-y-4">
                   {complaints.slice(0, 5).map(c => (
                     <div key={c._id} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${c.status === 'Resolved' ? 'bg-green-100 text-green-600' : c.status === 'In Progress' ? 'bg-blue-100 text-primary' : 'bg-orange-100 text-orange-600'}`}>
                             {c.status === 'Resolved' ? <CheckCircle2 className="h-5 w-5" /> : c.status === 'In Progress' ? <Clock className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                           </div>
                           <div>
                             <h4 className="font-semibold text-slate-800 text-sm truncate max-w-sm">{c.title}</h4>
                             <p className="text-slate-500 text-xs mt-0.5">{c.student?.name || 'Anonymous'} • {c.category}</p>
                           </div>
                        </div>
                        <span className="text-slate-400 text-xs font-medium bg-white px-2 py-1 rounded shadow-sm border border-slate-100">{new Date(c.createdAt).toLocaleDateString()}</span>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === "complaints" && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex flex-col xl:flex-row justify-between gap-4 mb-4">
                <div className="relative w-full xl:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input type="text" placeholder="Search by title or student name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm appearance-none text-sm font-medium text-slate-700">
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="w-full sm:w-auto pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-sm appearance-none text-sm font-medium text-slate-700">
                      <option value="All">All Categories</option>
                      <option>Hostel</option><option>Academics</option><option>Library</option><option>Canteen</option><option>Others</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-600 min-w-max relative">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 font-semibold w-80">Complaint Info</th>
                        <th className="px-4 py-4 font-semibold text-center">Category</th>
                        <th className="px-4 py-4 font-semibold text-center cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('priority')}>Priority {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-4 py-4 font-semibold text-center cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('status')}>Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-6 py-4 font-semibold w-48">Assigned Staff</th>
                        <th className="px-4 py-4 font-semibold text-center cursor-pointer hover:text-primary transition-colors select-none" onClick={() => handleSort('createdAt')}>Date {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredComplaints.length > 0 && filteredComplaints.map(complaint => {
                         const isUnassigned = !complaint.assignedTo;
                         return (
                        <tr key={complaint._id} 
                            onClick={() => openComplaintModal(complaint)} 
                            className="group transition-all cursor-pointer hover:bg-slate-50/80 bg-white">
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-start gap-2">
                                {complaint.isPinned && <Pin className="h-3.5 w-3.5 text-rose-500 fill-rose-500 mt-1 shrink-0" />}
                                <span className="font-semibold text-slate-800 line-clamp-2 leading-snug">{complaint.title}</span>
                              </div>
                              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                                <span className="truncate max-w-[120px] sm:max-w-[150px] font-medium">{complaint.student?.name || 'Unknown User'}</span>
                                {complaint.isAnonymous && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">(Anon)</span>}
                                 - <span className="truncate max-w-[150px] sm:max-w-[200px]">{complaint.location}</span>
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded text-xs font-medium border border-slate-200">{complaint.category}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {complaint.priority === 'High' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-100 text-red-700 uppercase tracking-wider border border-red-200">High</span>}
                            {complaint.priority === 'Medium' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider border border-orange-200">Medium</span>}
                            {complaint.priority === 'Low' && <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">Low</span>}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
                              ${complaint.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : 
                                complaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-orange-50 text-orange-700 border-orange-200'}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${complaint.status === 'Resolved' ? 'bg-green-500' : complaint.status === 'In Progress' ? 'bg-blue-500' : 'bg-orange-500'}`}></span>
                              {complaint.status}
                            </span>
                          </td>
                          <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                            {complaint.status === 'Pending' ? (
                               <select className="bg-white border border-slate-200 shadow-sm text-slate-700 text-xs rounded-lg focus:ring-primary focus:border-primary block w-full p-2 outline-none cursor-pointer font-medium"
                                       value={complaint.assignedTo?._id || ""}
                                       onChange={(e) => handleAssignStaff(complaint._id, e.target.value)}>
                                 <option value="" disabled>Select Staff to Assign</option>
                                 {staffMembers.map(staff => <option key={staff._id} value={staff._id}>{staff.name}</option>)}
                               </select>
                            ) : (
                               isUnassigned ? (
                                 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                                   <AlertTriangle className="h-3 w-3" /> Unassigned
                                 </span>
                               ) : (
                                 <div className="flex items-center gap-2">
                                   <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">{complaint.assignedTo?.name?.charAt(0)}</div>
                                   <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{complaint.assignedTo?.name}</span>
                                 </div>
                               )
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-xs font-medium text-slate-500">
                            {new Date(complaint.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                             <div className="flex items-center justify-end gap-2">
                                <button onClick={() => openComplaintModal(complaint)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors border border-transparent hover:border-primary/20" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button onClick={() => setEditModalComplaint({...complaint})} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="Edit Complaint">
                                  <Pencil className="h-4 w-4" />
                                </button>
                                
                                {complaint.status === "Pending" && (
                                  <button onClick={() => handleStatusChangeAction(complaint, "In Progress")} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-200" title="Start Progress">
                                    <Play className="h-4 w-4" />
                                  </button>
                                )}
                                {complaint.status === "In Progress" && (
                                  <button onClick={() => handleStatusChangeAction(complaint, "Resolved")} className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-200" title="Mark as Resolved">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </button>
                                )}
                             </div>
                          </td>
                        </tr>
                      )})}
                      {filteredComplaints.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center">
                               <MessageSquare className="h-10 w-10 text-slate-300 mb-3" />
                               <p className="text-lg font-medium text-slate-700">No complaints found</p>
                               <p className="text-sm">Try modifying your search or filters.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {(activeTab === "staffs" || activeTab === "students") && (
            <div className="animate-in fade-in duration-300 h-full flex flex-col">
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[400px]">
                {isLoadingUsers ? (
                  <div className="flex justify-center items-center h-64"><svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                ) : (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 font-semibold">User</th>
                        <th className="px-6 py-4 font-semibold">Role</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 font-semibold">Joined Date</th>
                        <th className="px-6 py-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => activeTab === "students" ? u.role === "student" : u.role !== "student").map(u => (
                        <tr key={u._id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-6 py-4 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">{u.name.charAt(0)}</div>
                            <div className="flex flex-col"><span className="font-bold text-slate-800">{u.name}</span><span className="text-xs text-slate-500">{u.email}</span></div>
                          </td>
                          <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm ${getRoleBadgeClass(u.role)}`}>{u.role}</span></td>
                          <td className="px-6 py-4">
                            <label className="relative inline-flex items-center cursor-pointer group" title={u.isActive !== false ? "Active users can access the system" : "Inactive users are blocked from login"}>
                              <input type="checkbox" className="sr-only peer" checked={u.isActive !== false} onChange={() => handleToggleUserStatus(u._id, u.isActive !== false)} disabled={u.role === 'admin'} />
                              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 disabled:opacity-50 group-hover:shadow-sm"></div>
                              <span className={`ml-3 text-xs font-bold uppercase tracking-wider ${u.isActive !== false ? 'text-emerald-600' : 'text-slate-400'}`}>{u.isActive !== false ? 'ON' : 'OFF'}</span>
                            </label>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-2">
                               <button onClick={() => setSelectedUserForModal(u)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="View User"><Eye className="h-4 w-4" /></button>
                               <button onClick={() => handleDeleteUser(u._id)} disabled={u.role === "admin"} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" title={u.role === "admin" ? "Cannot delete admin" : "Delete User"}><Trash2 className="h-4 w-4" /></button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-[#111827]/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 relative flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-start shrink-0 bg-slate-50 rounded-t-2xl">
              <div>
                 <div className="flex items-center gap-3 mb-2">
                   <h2 className="text-2xl font-bold text-slate-900">{selectedComplaint.title}</h2>
                   <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${selectedComplaint.status === 'Resolved' ? 'bg-green-50 text-green-700 border-green-200' : selectedComplaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>{selectedComplaint.status}</span>
                 </div>
                 <p className="text-sm text-slate-500 font-medium flex items-center flex-wrap gap-1.5">
                   Reported by <span className="text-slate-800 font-bold">{selectedComplaint.student?.name || 'Unknown User'}</span>
                   {selectedComplaint.isAnonymous && <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Anonymous Request</span>} 
                   <span className="ml-1">on {selectedComplaint.createdAt ? new Date(selectedComplaint.createdAt).toLocaleString() : 'Unknown Date'}</span>
                 </p>
              </div>
               <button onClick={() => setSelectedComplaint(null)} className="p-2 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition-colors shadow-sm border border-slate-200"><X className="h-5 w-5" /></button>
            </div>
            
            <div className="p-0 overflow-hidden flex-1 flex flex-col lg:flex-row bg-white relative">
               {/* Left Column - Details */}
               <div className="flex-1 overflow-y-auto p-6 border-b lg:border-b-0 lg:border-r border-slate-100">
                 <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-slate-900 tracking-wide mb-2 uppercase text-xs">Description</h4>
                      <p className="text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100 leading-relaxed text-sm">{selectedComplaint.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Category</h4><p className="font-medium text-slate-800">{selectedComplaint.category}</p></div>
                       <div><h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Location</h4><p className="font-medium text-slate-800">{selectedComplaint.location}</p></div>
                       {selectedComplaint.gpsCoordinates && (
                         <div className="col-span-2">
                           <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">GPS Coordinates</h4>
                           <p className="font-medium text-slate-800 text-sm mono bg-slate-100 p-2 rounded max-w-max">{selectedComplaint.gpsCoordinates.lat?.toFixed(6)}, {selectedComplaint.gpsCoordinates.lng?.toFixed(6)}</p>
                         </div>
                       )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 tracking-wide mb-3 uppercase text-xs flex items-center gap-2"><ImageIcon className="h-4 w-4 text-slate-400"/> Photographic Evidence</h4>
                      {selectedComplaint.images?.length > 0 ? (
                         <div className="grid grid-cols-2 gap-3">
                           {selectedComplaint.images.map((img, i) => (
                             <a key={i} href={getAssetUrl(img)} target="_blank" rel="noreferrer" className="block aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 relative group">
                               <img src={getAssetUrl(img)} alt="evidence" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                             </a>
                           ))}
                         </div>
                      ) : (
                         <div className="bg-slate-50 rounded-xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center">
                           <ImageIcon className="h-10 w-10 text-slate-300 mb-2" />
                           <p className="text-sm font-medium text-slate-500">No images provided</p>
                         </div>
                      )}
                    </div>
                    
                    {selectedComplaint.remarks && (
                       <div className="mt-8 pt-6 border-t border-slate-100">
                          <h4 className="font-bold text-slate-900 tracking-wide mb-3 uppercase text-xs flex items-center gap-2">Official Remarks</h4>
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-blue-900 text-sm">
                            <p>{selectedComplaint.remarks}</p>
                          </div>
                       </div>
                    )}
                 </div>
               </div>
               
               {/* Right Column - Messages */}
               <div className="w-full lg:w-96 flex flex-col bg-slate-50/50">
                  <div className="p-4 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                       <MessageSquare className="h-4 w-4 text-primary" /> Internal & External Comms
                    </h3>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {comments.length === 0 ? (
                       <p className="text-sm text-slate-400 text-center py-10">No messages yet.</p>
                     ) : (
                       comments.map(c => {
                          const isMe = c.user?._id === user?._id;
                          const isStaffTag = c.text?.startsWith('[To Staff]');
                          const isStudentTag = c.text?.startsWith('[To Student]');
                          let msgClass = 'bg-white border-slate-200';
                         if (isStaffTag) msgClass = 'bg-blue-50 border-blue-200';
                         if (isStudentTag) msgClass = 'bg-green-50 border-green-200';
                         
                         return (
                           <div key={c._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3`}>
                             <div className={`max-w-[85%] border rounded-2xl p-3 shadow-sm relative ${msgClass} ${c.isInternal ? 'ring-2 ring-amber-400/50 mt-2' : ''}`}>
                                {c.isInternal && (
                                  <div className="absolute -top-2.5 -right-2 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shadow-sm">
                                    <Lock className="h-3 w-3" /> Internal Note
                                  </div>
                                )}
                                <p className="text-xs font-bold text-slate-400 mb-1">{c.user?.name || 'Unknown User'}</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap">{c.text}</p>
                                {c.images && c.images.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {c.images.map((img, idx) => (
                                      <a key={idx} href={getAssetUrl(img)} target="_blank" rel="noreferrer" className="h-16 w-16 rounded-md overflow-hidden border border-slate-200 block hover:opacity-80 transition-opacity">
                                        <img src={getAssetUrl(img)} alt="Attached" className="w-full h-full object-cover" />
                                      </a>
                                    ))}
                                  </div>
                                )}
                             </div>
                             <span className="text-[10px] items-center text-slate-400 mt-1 px-1">{c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                           </div>
                         )
                       })
                     )}
                  </div>
                  
                  {selectedComplaint.status !== "Resolved" ? (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <div className="flex flex-col gap-3">
                         <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 group">
                               <input type="checkbox" checked={isInternalComment} onChange={e => setIsInternalComment(e.target.checked)} className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 transition-all" />
                               <span className="group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                                 <Lock className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-500 transition-colors" /> Internal Note (Admin/Staff only)
                               </span>
                            </label>
                         </div>
                         <div className="relative">
                            <input 
                              type="text" 
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder={isInternalComment ? "Type an internal note..." : "Type a public message..."}
                              className="w-full pl-4 pr-24 py-3.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm shadow-sm transition-all"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                              <label className="p-2 text-slate-400 hover:text-primary cursor-pointer transition-colors" title="Attach Image">
                                <ImageIcon className="h-4 w-4" />
                                <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => setCommentImages(Array.from(e.target.files))} />
                              </label>
                              <button 
                                onClick={handleSendMessage} 
                                disabled={(!newMessage.trim() && commentImages.length === 0) || isUploadingImage} 
                                className="p-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                              >
                                <Send className="h-4 w-4" />
                              </button>
                            </div>
                         </div>
                         {commentImages.length > 0 && (
                           <div className="flex gap-2 flex-wrap">
                             {commentImages.map((img, idx) => (
                               <div key={idx} className="text-[10px] bg-slate-100 border border-slate-200 text-slate-600 px-2 py-1 rounded truncate max-w-[100px]">{img.name}</div>
                             ))}
                             <button type="button" onClick={() => setCommentImages([])} className="text-[10px] text-red-500 hover:underline">Clear</button>
                           </div>
                         )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
                       <p className="text-xs font-medium text-slate-500 flex items-center justify-center gap-1"><CheckCircle2 className="h-4 w-4"/> Discussion closed (Resolved)</p>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {isStaffModalOpen && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl border border-slate-100 relative">
            <button onClick={() => setIsStaffModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Add Staff Member</h2>
            <p className="text-sm text-slate-500 mb-6">Create a secure administrative account for faculty, staff, or wardens.</p>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Full Name <span className="text-red-500">*</span></label><input required type="text" value={staffData.name} onChange={e => setStaffData({...staffData, name: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-[#FACC15]" placeholder="Jane Smith" /></div>
                <div><label className="block text-sm font-medium text-slate-700 mb-1">Staff ID <span className="text-red-500">*</span></label><input required type="text" value={staffData.staffId} onChange={e => setStaffData({...staffData, staffId: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-[#FACC15]" placeholder="SF-1234" /></div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Email Address <span className="text-red-500">*</span></label><input required type="email" value={staffData.email} onChange={e => setStaffData({...staffData, email: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-[#FACC15]" placeholder="staff@campus.edu" /></div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Role <span className="text-red-500">*</span></label>
                <select required value={staffData.role} onChange={e => setStaffData({...staffData, role: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-[#FACC15] bg-white text-sm">
                  <option value="staff">Staff</option><option value="faculty">Faculty</option><option value="warden">Hostel Warden</option><option value="librarian">Librarian</option><option value="canteen_manager">Canteen Manager</option><option value="admin">System Admin</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Password Generation Strategy</label>
                   <input required minLength={6} type="text" readOnly value={staffData.password} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 font-mono text-sm focus:outline-none" placeholder="Generated password here" />
                </div>
                <div>
                   <button type="button" onClick={generatePassword} className="w-full px-3 py-2.5 border border-slate-300 bg-slate-50 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-sm">Auto-Generate & Lock</button>
                </div>
              </div>

              <div className="pt-2">
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                   <input type="checkbox" checked={staffData.isActive} onChange={e => setStaffData({...staffData, isActive: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-[#FACC15] focus:ring-[#FACC15]" />
                   <div className="flex flex-col">
                     <span className="text-sm font-bold text-slate-800">Active Account Status</span>
                     <span className="text-xs text-slate-500">{staffData.isActive ? "This account can log in immediately" : "This account is disabled and cannot be accessed"}</span>
                   </div>
                 </label>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsStaffModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting || !staffData.password} className="px-5 py-2.5 text-sm font-bold text-slate-900 bg-[#FACC15] hover:bg-[#EAB308] rounded-lg disabled:opacity-70">{isSubmitting ? "Adding..." : "Add Staff Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {editModalComplaint && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl border border-slate-100 relative">
            <button onClick={() => setEditModalComplaint(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Edit Complaint</h2>
            <p className="text-xs text-slate-500 mb-6 truncate">{editModalComplaint.title}</p>
            
            {editModalComplaint.status === "Resolved" ? (
              <div className="space-y-4">
                 <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-xl flex items-start gap-3">
                   <AlertOctagon className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                   <p className="text-sm font-medium">This complaint has been resolved. You have the administrative privilege to permanently delete it to clean up the workspace.</p>
                 </div>
                 <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setEditModalComplaint(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button onClick={() => handleDelete(editModalComplaint._id)} className="px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg flex items-center gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Complaint
                    </button>
                 </div>
              </div>
            ) : (
              <form onSubmit={handleSaveEdit} className="space-y-6">
                 <div>
                   <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                     <input type="checkbox" checked={editModalComplaint.isPinned || false} onChange={e => setEditModalComplaint({...editModalComplaint, isPinned: e.target.checked})} className="h-4 w-4 rounded border-slate-300 text-[#FACC15] focus:ring-[#FACC15]" />
                     <div className="flex flex-col">
                       <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5"><Pin className="h-3.5 w-3.5 text-slate-500" /> Pin to Top</span>
                       <span className="text-xs text-slate-500">Keep this complaint at the top of the list</span>
                     </div>
                   </label>
                 </div>
                 
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Escalation Priority</label>
                    <select value={editModalComplaint.priority} onChange={e => setEditModalComplaint({...editModalComplaint, priority: e.target.value})} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-[#FACC15] bg-white text-sm font-medium">
                      <option value="Low">Low - Routine issue</option>
                      <option value="Medium">Medium - Standard priority</option>
                      <option value="High">High - Urgent / Escalate</option>
                    </select>
                 </div>
                 
                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button type="button" onClick={() => setEditModalComplaint(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-sm font-bold text-slate-900 bg-[#FACC15] hover:bg-[#EAB308] rounded-lg">Save Changes</button>
                 </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* View User Modal */}
      {selectedUserForModal && (
        <div className="fixed inset-0 bg-[#111827]/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl border border-slate-100 relative">
             <button onClick={() => setSelectedUserForModal(null)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"><X className="h-5 w-5" /></button>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl shrink-0">{selectedUserForModal.name.charAt(0)}</div>
                <div>
                   <h2 className="text-xl font-bold text-slate-900">{selectedUserForModal.name}</h2>
                   <p className="text-sm text-slate-500">{selectedUserForModal.email}</p>
                   <div className="flex gap-2 mt-2">
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getRoleBadgeClass(selectedUserForModal.role)}`}>{selectedUserForModal.role}</span>
                     <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${selectedUserForModal.isActive !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{selectedUserForModal.isActive !== false ? 'Active' : 'Inactive'}</span>
                   </div>
                </div>
             </div>

             <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 mb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Activity Statistics</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                   {selectedUserForModal.role === 'student' ? (
                     <>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-slate-800">{complaints.filter(c => c.student?._id === selectedUserForModal._id).length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Total</p>
                       </div>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-orange-500">{complaints.filter(c => c.student?._id === selectedUserForModal._id && c.status === 'Pending').length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Pending</p>
                       </div>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-emerald-500">{complaints.filter(c => c.student?._id === selectedUserForModal._id && c.status === 'Resolved').length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Resolved</p>
                       </div>
                     </>
                   ) : (
                     <>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-slate-800">{complaints.filter(c => c.assignedTo?._id === selectedUserForModal._id).length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Assigned</p>
                       </div>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-blue-500">{complaints.filter(c => c.assignedTo?._id === selectedUserForModal._id && c.status === 'In Progress').length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">In Progress</p>
                       </div>
                       <div className="bg-white p-2 rounded-lg border border-slate-100">
                         <p className="text-2xl font-black text-emerald-500">{complaints.filter(c => c.assignedTo?._id === selectedUserForModal._id && c.status === 'Resolved').length}</p>
                         <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">Resolved</p>
                       </div>
                     </>
                   )}
                </div>
             </div>

             <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleToggleUserStatus(selectedUserForModal._id, selectedUserForModal.isActive !== false)}
                  disabled={selectedUserForModal.role === 'admin'}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm transition-colors ${selectedUserForModal.isActive !== false ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {selectedUserForModal.isActive !== false ? "Deactivate Account" : "Activate Account"}
                </button>
                <button 
                  onClick={() => { handleDeleteUser(selectedUserForModal._id); setSelectedUserForModal(null); }}
                  disabled={selectedUserForModal.role === 'admin'}
                  className="w-full py-2.5 rounded-lg font-bold text-sm bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete User
                </button>
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

function StatCard({ title, value, icon, color, bg }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div><p className="text-sm font-medium text-slate-500 mb-1.5">{title}</p><p className="text-3xl font-extrabold text-slate-900">{value}</p></div>
      <div className={`h-14 w-14 rounded-2xl ${bg} flex items-center justify-center ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
    </div>
  );
}

function ShieldCheckIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function getRoleBadgeClass(role) {
  switch (role) {
    case 'student': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'warden': return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'faculty': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'staff': return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'librarian': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'canteen_manager': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    case 'admin': return 'bg-slate-800 text-slate-100 border-slate-700';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
}
