import express from "express";
import OTP from "../models/OTP.js";
import User from "../models/User.js";
import WorkerProfile from "../models/WorkerProfile.js";
import EmployerProfile from "../models/EmployerProfile.js";
import SupplierProfile from "../models/SupplierProfile.js";
import { generateOTP } from "../utils/otp.js";
import { sendOTPviaFast2SMS } from "../utils/sms.js";
import jwt from "jsonwebtoken";

const router = express.Router();

// SEND OTP
router.post("/send-otp", async (req, res) => {
  try {
    const { phone, role, mode = "login" } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone is required" });
    }

    const existingUser = await User.findOne({ phone });

    if (mode === "signup") {
      if (!role) {
        return res.status(400).json({ message: "Please select a role to sign up." });
      }
      if (existingUser) {
        return res.status(400).json({
          message: `This phone is already registered as ${existingUser.role}. Please login.`,
        });
      }
    } else {
      if (!existingUser) {
        return res.status(404).json({
          message: "Account not found. Please sign up first.",
        });
      }
    }

    // Generate OTP
    const otp = generateOTP();

    // Save OTP
    await OTP.create({
      phone,
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 mins
    });

    // Send via SMS
    try {
      await sendOTPviaFast2SMS(phone, otp);
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (smsError) {
      console.error("SMS sending failed:", smsError);
      // Still return success but log the error
      // OTP is saved in DB, user can verify if they receive it
      res.json({ 
        success: true, 
        message: "OTP generated. Please check your phone for SMS.",
        warning: "SMS delivery may be delayed"
      });
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

// VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { phone, role, otp, mode = "login" } = req.body;

    const record = await OTP.findOne({ phone }).sort({ expiresAt: -1 });

    if (!record) return res.status(400).json({ message: "No OTP found" });

    if (record.expiresAt < Date.now())
      return res.status(400).json({ message: "OTP expired" });

    if (record.otp !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    // USER HANDLING
    let user = await User.findOne({ phone });

    if (!user) {
      if (mode === "login") {
        return res.status(404).json({
          message: "Account not found. Please sign up first."
        });
      }

      if (!role) {
        return res.status(400).json({
          message: "Role selection is required for signup."
        });
      }

      user = await User.create({ phone, role });
    } else {
      if (role && user.role !== role) {
        return res.status(400).json({
          message: `This phone number is already registered as ${user.role}`
        });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Get profile status for workers, employers, and suppliers
    let profileStatus = null;
    if (user.role === "worker") {
      const profile = await WorkerProfile.findOne({ userId: user._id });
      profileStatus = {
        isProfileComplete: profile?.isProfileComplete || false,
        profileCompletionStep: profile?.profileCompletionStep || 1
      };
    } else if (user.role === "employer") {
      const profile = await EmployerProfile.findOne({ userId: user._id });
      profileStatus = {
        isProfileComplete: profile?.isProfileComplete || false,
        profileCompletionStep: profile?.profileCompletionStep || 1
      };
    } else if (user.role === "supplier") {
      const profile = await SupplierProfile.findOne({ userId: user._id });
      profileStatus = {
        isProfileComplete: profile?.isProfileComplete || false,
        profileCompletionStep: profile?.profileCompletionStep || 1
      };
    }

    res.json({
      success: true,
      message: "OTP verified",
      token,
      role: user.role,
      ...(profileStatus && { profileStatus })
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
