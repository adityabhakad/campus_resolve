import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

dotenv.config();

// Connect to database (now deferred until starting server)

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  ...(process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(",") : []),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].filter(Boolean).map((origin) => origin.trim());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/upload", uploadRoutes);

// Make the uploads folder publicly accessible
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("Campus Resolve API is running...");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
  });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });
});
