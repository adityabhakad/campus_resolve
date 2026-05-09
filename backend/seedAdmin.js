import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";

dotenv.config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminEmail = "admin@campus.edu";
    const adminExists = await User.findOne({ email: adminEmail });

    if (adminExists) {
      console.log("Admin already exists. Updating password to password123");
      adminExists.password = "password123";
      adminExists.role = "admin";
      await adminExists.save();
      console.log("Admin password updated!");
    } else {
      console.log("Admin does not exist. Creating...");
      await User.create({
        name: "System Admin",
        email: adminEmail,
        password: "password123",
        phoneNumber: "+91 0000000000",
        role: "admin",
      });
      console.log("Admin account successfully created!");
    }
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
};

seedAdmin();
