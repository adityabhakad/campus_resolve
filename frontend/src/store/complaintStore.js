import { create } from 'zustand';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const useComplaintStore = create((set, get) => ({
  complaints: [],
  isLoading: false,

  fetchComplaints: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/complaints');
      set({ complaints: res.data, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      toast.error("Failed to fetch complaints");
    }
  },

  addComplaint: async (complaintData) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/complaints', complaintData);
      set((state) => ({
        complaints: [res.data, ...state.complaints],
        isLoading: false
      }));
      toast.success("Complaint submitted successfully!");
      return true;
    } catch (error) {
      set({ isLoading: false });
      toast.error(error.response?.data?.error || "Failed to submit complaint");
      return false;
    }
  },

  updateComplaintStatus: async (id, status, remarks) => {
    try {
      const res = await api.put(`/complaints/${id}/status`, { status, remarks });
      set((state) => ({
        complaints: state.complaints.map(c => 
          c._id === id ? res.data : c
        )
      }));
      toast.success("Status updated!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
      return false;
    }
  },

  assignStaff: async (id, staffId) => {
    try {
      const res = await api.put(`/complaints/${id}/assign`, { staffId });
      set((state) => ({
        complaints: state.complaints.map(c => 
          c._id === id ? res.data : c
        )
      }));
      toast.success("Staff assigned successfully!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to assign staff");
      return false;
    }
  },

  deleteComplaint: async (id) => {
    try {
      await api.delete(`/complaints/${id}`);
      set((state) => ({
        complaints: state.complaints.filter(c => c._id !== id)
      }));
      toast.success("Complaint deleted permanently!");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete complaint");
      return false;
    }
  },

  updateComplaintDetails: async (id, data) => {
    try {
      const res = await api.put(`/complaints/${id}/details`, data);
      set((state) => ({
        complaints: state.complaints.map(c => 
          c._id === id ? res.data : c
        )
      }));
      toast.success("Complaint details updated!");
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update details");
      return false;
    }
  }
}));

export default useComplaintStore;
