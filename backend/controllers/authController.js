import jwt from "jsonwebtoken";
import User from "../models/User.js";

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
});

const getClearCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  expires: new Date(0),
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { 
      name, email, password, role, department, 
      phoneNumber, rollNumber, year, residence, 
      staffId, designation 
    } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      role: role || 'student',
      department,
      rollNumber,
      year,
      residence,
      staffId,
      designation
    });

    if (user) {
      const token = generateToken(user._id);
      
      res.cookie('jwt', token, getCookieOptions());

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: token
      });
    } else {
      res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.matchPassword(password))) {
      if (user.isActive === false) {
        return res.status(403).json({ error: "Your account has been deactivated. Please contact an administrator." });
      }

      const token = generateToken(user._id);

      res.cookie('jwt', token, getCookieOptions());

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        token: token
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = (req, res) => {
  res.cookie('jwt', '', getClearCookieOptions());
  res.status(200).json({ message: "Logged out successfully" });
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Create a new staff account
// @route   POST /api/auth/staff
// @access  Private (Admin)
export const createStaff = async (req, res) => {
  try {
    const { name, email, password, staffId, department, role, isActive } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const user = await User.create({
      name,
      email,
      password,
      phoneNumber: "0000000000", // Dummy bypass since schema demands it but UI doesn't for staff
      role: role || "staff",
      staffId,
      department,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ message: "Staff account created successfully", user: { _id: user._id, email: user.email }});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/auth/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot delete admin users" });

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ error: "Invalid current password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// @desc    Update a user's active status
// @route   PUT /api/auth/users/:id/status
// @access  Private (Admin)
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role === "admin") return res.status(400).json({ error: "Cannot modify admin status" });

    user.isActive = isActive;
    await user.save();
    
    const updatedUser = await User.findById(req.params.id).select("-password");
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
