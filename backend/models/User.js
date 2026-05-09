import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please add a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    phoneNumber: {
      type: String,
      required: [true, "Please add a phone number"],
    },
    role: {
      type: String,
      enum: ["student", "staff", "admin", "warden", "faculty", "librarian", "canteen_manager"],
      default: "student",
    },
    // Common optional field but usually for both roles
    department: {
      type: String,
    },
    // Student specific fields
    rollNumber: {
      type: String,
    },
    year: {
      type: String,
      enum: ["FE", "SE", "TE", "BE"],
    },
    residence: {
      type: String,
      enum: ["Hostel", "Day Scholar"],
    },
    // Staff specific fields
    staffId: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    }
  },
  {
    timestamps: true,
  }
);

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model("User", userSchema);

export default User;
