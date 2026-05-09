import Complaint from "../models/Complaint.js";
import Comment from "../models/Comment.js";
import User from "../models/User.js";

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, location, gpsCoordinates, images, isAnonymous } = req.body;
    let roleToAssign = "staff";
    if (category === "Hostel") roleToAssign = "warden";
    else if (category === "Academics") roleToAssign = "faculty";
    else if (category === "Library") roleToAssign = "librarian";
    else if (category === "Canteen") roleToAssign = "canteen_manager";

    const defaultAssignee = await User.findOne({ role: roleToAssign, isActive: true });

    const complaint = await Complaint.create({
      student: req.user._id,
      title,
      description,
      category,
      location,
      gpsCoordinates,
      priority: "Medium",
      images,
      isAnonymous,
      assignedTo: defaultAssignee ? defaultAssignee._id : undefined,
      status: "Pending",
    });

    // Populate student info for immediate return
    const populatedComplaint = await Complaint.findById(complaint._id).populate(
      "student",
      "name email department"
    );

    res.status(201).json(populatedComplaint);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get all complaints (with filters)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    let query = {};
    
    // Students only see their own complaints
    if (req.user.role === "student") {
      query.student = req.user._id;
    }
    
    // Role-based category routing
    if (req.user.role === "faculty") {
      query.category = "Academics";
    } else if (req.user.role === "warden") {
      query.category = "Hostel";
    } else if (req.user.role === "librarian") {
      query.category = "Library";
    } else if (req.user.role === "canteen_manager") {
      query.category = "Canteen";
    } else if (req.user.role === "staff") {
      query.category = "Others";
    }
    
    // Admins see everything (no extra query filters applied here unless by req.query)
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category && req.user.role === "admin") query.category = req.query.category;

    const complaints = await Complaint.find(query).sort({ createdAt: -1 })
      .populate("student", "name email")
      .populate("assignedTo", "name role");

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private (Staff/Warden/Admin)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    complaint.status = status || complaint.status;
    if (remarks) complaint.remarks = remarks;
    if (!complaint.assignedTo) complaint.assignedTo = req.user._id;

    const updatedComplaint = await complaint.save();
    res.json(updatedComplaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Assign staff to a complaint
// @route   PUT /api/complaints/:id/assign
// @access  Private (Admin)
export const assignStaff = async (req, res) => {
  try {
    const { staffId } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    complaint.assignedTo = staffId;
    // Set status to In Progress automatically if assigned and was Pending
    if (complaint.status === "Pending") complaint.status = "In Progress";
    
    const updatedComplaint = await complaint.save();
    
    const populated = await Complaint.findById(updatedComplaint._id)
      .populate("student", "name email")
      .populate("assignedTo", "name role");
      
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Add a comment/message to a complaint
// @route   POST /api/complaints/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text, type, isInternal, images } = req.body;
    let finalMsg = text;
    if (type === "staff_tag") finalMsg = `[To Staff] ${text}`;
    if (type === "student_tag") finalMsg = `[To Student] ${text}`;

    const comment = await Comment.create({
      complaint: req.params.id,
      user: req.user._id,
      text: finalMsg,
      isInternal: isInternal || false,
      images: images || [],
    });
    
    // Update complaint unread status
    const complaintToUpdate = await Complaint.findById(req.params.id);
    if (complaintToUpdate) {
      if (req.user.role === "student") {
        complaintToUpdate.hasUnreadForStaff = true;
        complaintToUpdate.hasUnreadForAdmin = true;
      } else if (req.user.role === "admin") {
        if (!isInternal) complaintToUpdate.hasUnreadForStudent = true;
        complaintToUpdate.hasUnreadForStaff = true;
      } else {
        if (!isInternal) complaintToUpdate.hasUnreadForStudent = true;
        complaintToUpdate.hasUnreadForAdmin = true;
      }
      complaintToUpdate.updatedAt = Date.now();
      await complaintToUpdate.save();
    }
    
    const populated = await Comment.findById(comment._id).populate("user", "name role");
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// @desc    Get comments for a complaint
// @route   GET /api/complaints/:id/comments
// @access  Private
export const getComments = async (req, res) => {
  try {
    let query = { complaint: req.params.id };
    if (req.user.role === "student") {
      query.isInternal = { $ne: true };
    }
    
    // Clear unread flag
    const complaintToUpdate = await Complaint.findById(req.params.id);
    if (complaintToUpdate) {
      let changed = false;
      if (req.user.role === "student" && complaintToUpdate.hasUnreadForStudent) {
        complaintToUpdate.hasUnreadForStudent = false;
        changed = true;
      } else if (req.user.role === "admin" && complaintToUpdate.hasUnreadForAdmin) {
        complaintToUpdate.hasUnreadForAdmin = false;
        changed = true;
      } else if (req.user.role !== "student" && req.user.role !== "admin" && complaintToUpdate.hasUnreadForStaff) {
        complaintToUpdate.hasUnreadForStaff = false;
        changed = true;
      }
      if (changed) await complaintToUpdate.save();
    }

    const comments = await Comment.find(query)
      .populate("user", "name role")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update complaint details (priority, pinned)
// @route   PUT /api/complaints/:id/details
// @access  Private (Admin)
export const updateComplaintDetails = async (req, res) => {
  try {
    const { priority, isPinned } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    if (priority !== undefined) complaint.priority = priority;
    if (isPinned !== undefined) complaint.isPinned = isPinned;

    const updatedComplaint = await complaint.save();
    
    const populated = await Complaint.findById(updatedComplaint._id)
      .populate("student", "name email")
      .populate("assignedTo", "name role");
      
    res.json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin)
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: "Complaint not found" });
    }

    // Usually you'd also want to delete related comments, but let's keep it simple or do it
    await Comment.deleteMany({ complaint: req.params.id });
    await complaint.deleteOne();

    res.json({ message: "Complaint removed" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
