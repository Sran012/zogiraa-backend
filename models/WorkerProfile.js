import mongoose from "mongoose";

const WorkerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },

  // Step 1 - Personal
  fullName: { type: String },
  mobileNo: { type: String },         // redundant with User.phone but keep for UI
  aadharNumber: { type: String },
  dob: { type: Date },
  gender: { type: String, enum: ["male","female","other"] },
  profilePhotoUrl: { type: String },

  // Step 2 - Address
  address: {
    villageOrCity: String,
    district: String,
    state: String,
    pincode: String,
    fullAddress: String,
    pinnedLocation: { lat: Number, lon: Number } // optional, if user pins
  },

  // Step 3 - Job & Skills (you showed job categories/tools)
  jobCategories: { type: [String], default: [] }, // e.g. ["mason","plumber"]
  skillLevel: { type: String }, // e.g. "beginner","intermediate","expert"
  yearsOfExperience: { type: Number, default: 0 },
  toolsOwned: { type: [String], default: [] }, // ["hammer","drill"]
  
  // Step 4 - Work Preferences & Bank/payment
  preferredWorkType: { type: String }, // daily/weekly/monthly/yearly
  preferredLocation: { type: String },
  workTimeFrom: { type: String }, // "09:00"
  workTimeTo: { type: String },   // "18:00"
  expectedWage: { type: Number },
  willingToRelocate: { type: Boolean, default: false },

  // Bank & Payment (more sensitive)
  bankAccountNumber: { type: String },
  ifscCode: { type: String },
  upiId: { type: String },
  preferredPaymentMode: { type: String, enum: ["bank","upi","cash","none"], default: "none" },
  qrCodeImageUrl: { type: String },        // uploaded QR code image

  // Additional documents (Aadhaar photo, bank statement etc)
  aadharFrontUrl: { type: String },
  aadharBackUrl: { type: String },
  bankStatementUrl: { type: String },

  // device type / phone type
  mobileType: { type: String, enum: ["keypad","smartphone","unknown"], default: "unknown" },

  // Step 5 - Benefits kit selection + agreement
  benefitKitItems: { type: [String], default: [] }, // e.g. ["cap","tshirt"]
  readDocsAccepted: { type: Boolean, default: false },

  // status & timestamps
  profileCompletionStep: { type: Number, default: 1, min: 1, max: 5 }, // Tracks which step user is on (1-5)
  isProfileComplete: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending","approved","rejected"], default: "pending" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// update 'updatedAt'
WorkerProfileSchema.pre('save', function(next){
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("WorkerProfile", WorkerProfileSchema);
