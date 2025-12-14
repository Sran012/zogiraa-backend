import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  role: { type: String, enum: ["worker", "employer", "supplier"], required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
