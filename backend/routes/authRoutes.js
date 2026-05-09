import express from "express";
import { register, login, logout, getMe, createStaff, getUsers, deleteUser, changePassword, updateUserStatus } from "../controllers/authController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.put("/password", protect, changePassword);
router.post("/staff", protect, authorize("admin"), createStaff);

router.get("/users", protect, authorize("admin"), getUsers);
router.delete("/users/:id", protect, authorize("admin"), deleteUser);
router.put("/users/:id/status", protect, authorize("admin"), updateUserStatus);

export default router;
