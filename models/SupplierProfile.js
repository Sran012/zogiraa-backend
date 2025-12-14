import mongoose from "mongoose";

const SupplierProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true, unique: true },

  // Step 1 - Personal & Business Details
  fullName: { type: String },
  companyName: { type: String },
  mobileNo: { type: String },
  email: { type: String },
  city: { type: String },
  state: { type: String },
  gstNumber: { type: String },
  businessAddress: { type: String },
  mobileNumberVerified: { type: Boolean, default: false },

  // Step 2 - Product Categories
  productCategories: { type: [String], default: [] }, // e.g. ["Cement", "Steel", "Paints", "Pipes & Plumbing"]

  // Step 3 - Product Details
  products: [{
    productName: { type: String, required: true },
    brand: { type: String },
    price: { type: Number, required: true },
    unit: { type: String, required: true }, // e.g. "kg", "bag", "meter"
    minOrderQty: { type: Number, required: true },
    productImageUrl: { type: String }
  }],

  // Step 4 - Business Verification Documents & Bank Details
  // Documents
  gstCertificateUrl: { type: String },
  panCardUrl: { type: String },
  udyamCertificateUrl: { type: String }, // Optional
  tradeLicenseUrl: { type: String }, // Optional
  
  // Bank Details for Payout
  accountHolderName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
  cancelledChequeUrl: { type: String }, // Optional
  
  // Verification checkboxes
  documentsConfirmed: { type: Boolean, default: false }, // "I confirm that the documents are accurate and up-to-date"
  supplierTermsAccepted: { type: Boolean, default: false }, // "I agree to Zogiraa's supplier terms & conditions"

  // Step 5 - Final Review (readDocsAccepted is the final confirmation)
  readDocsAccepted: { type: Boolean, default: false },

  // status & timestamps
  profileCompletionStep: { type: Number, default: 1, min: 1, max: 5 }, // Tracks which step user is on (1-5)
  isProfileComplete: { type: Boolean, default: false },
  verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// update 'updatedAt'
SupplierProfileSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("SupplierProfile", SupplierProfileSchema);

