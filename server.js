import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";

// Load environment variables
dotenv.config();

// Log environment status (for debugging)
console.log("Environment check:");
console.log("- FAST2SMS_MODE:", process.env.FAST2SMS_MODE || "not set");
console.log("- FAST2SMS_KEY:", process.env.FAST2SMS_KEY ? "configured (" + process.env.FAST2SMS_KEY.length + " chars)" : "NOT SET");
console.log("- PORT:", process.env.PORT || "not set");
connectDB();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);

app.get("/", (req, res) => res.send("Zogiraa Backend Running"));

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
