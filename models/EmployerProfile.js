import mongoose from "mongoose";

const EmployerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },

  // Step 1 - Personal Details
  fullName: { type: String },
  mobileNo: { type: String },
  aadharNumber: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ["male", "female", "other"] },
  profilePhotoUrl: { type: String },

  // Step 2 - Address
  address: {
    villageOrCity: String,
    district: String,
    state: String,
    pincode: String,
    fullAddress: String,
    nearbyLandmark: String,
    pinnedLocation: { lat: Number, lon: Number },
    isPermanentAddress: { type: Boolean, default: false }
  },

  // Step 3 - Company Details
  companyName: { type: String }, // Company/Owner Name
  gstNumber: { type: String }, // GST/Business ID (Optional)
  contactNumber: { type: String },
  contactNumberVerified: { type: Boolean, default: false },

  // Step 4 - Bank & Payment Setup
  bankAccountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },
  preferredPaymentMode: { type: String, enum: ["bank", "upi", "cash", "none"], default: "none" },
  qrCodeImageUrl: { type: String }, // uploaded QR code image

  // Step 5 - Wage & Payment Preferences (for job postings)
  defaultWagePerDay: { type: Number },
  defaultPaymentMode: { type: String, enum: ["bank", "upi", "cash", "none"] },

  // Step 6 - Documents
  aadharFrontUrl: { type: String },
  aadharBackUrl: { type: String },
  bankStatementUrl: { type: String }, // Bank Proof
  readDocsAccepted: { type: Boolean, default: false },

  // status & timestamps
  profileCompletionStep: { type: Number, default: 1, min: 1, max: 6 }, // Tracks which step user is on (1-6)
  isProfileComplete: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// update 'updatedAt'
EmployerProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("EmployerProfile", EmployerProfileSchema);

