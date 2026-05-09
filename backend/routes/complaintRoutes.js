import express from "express";
import { 
  createComplaint, 
  getComplaints, 
  updateComplaintStatus,
  assignStaff,
  addComment,
  getComments,
  deleteComplaint,
  updateComplaintDetails
} from "../controllers/complaintController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .post(protect, authorize("student", "admin"), createComplaint)
  .get(protect, getComplaints);

router.route("/:id")
  .delete(protect, authorize("admin"), deleteComplaint);

router.route("/:id/details")
  .put(protect, authorize("admin", "staff", "warden", "faculty", "librarian", "canteen_manager"), updateComplaintDetails);

router.route("/:id/status")
  .put(protect, authorize("staff", "warden", "faculty", "admin", "librarian", "canteen_manager"), updateComplaintStatus);

router.route("/:id/assign")
  .put(protect, authorize("admin"), assignStaff);

router.route("/:id/comments")
  .post(protect, addComment)
  .get(protect, getComments);

export default router;
