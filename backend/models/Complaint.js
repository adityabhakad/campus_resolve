import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please add a complaint title"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: [
        "Academics",
        "Hostel",
        "Library",
        "Canteen",
        "Others"
      ],
    },
    location: {
      type: String,
      required: [true, "Please specify the location"],
    },
    gpsCoordinates: {
      lat: Number,
      lng: Number
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Resolved", "Rejected"],
      default: "Pending",
    },
    images: {
      type: [String],
      default: [],
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    remarks: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    feedback: {
      type: String,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    hasUnreadForStudent: {
      type: Boolean,
      default: false,
    },
    hasUnreadForStaff: {
      type: Boolean,
      default: false,
    },
    hasUnreadForAdmin: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
