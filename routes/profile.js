import express from "express";
import authMiddleware from "../middleware/auth.js";
import WorkerProfile from "../models/WorkerProfile.js";
import EmployerProfile from "../models/EmployerProfile.js";
import SupplierProfile from "../models/SupplierProfile.js";
import User from "../models/User.js";

const router = express.Router();

// GET /me - Get current user profile status
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let profile = null;
    let defaultStep = 1;
    let maxStep = 5;

    if (role === "worker") {
      profile = await WorkerProfile.findOne({ userId });
      defaultStep = 1;
      maxStep = 5;
    } else if (role === "employer") {
      profile = await EmployerProfile.findOne({ userId });
      defaultStep = 1;
      maxStep = 6;
    } else if (role === "supplier") {
      profile = await SupplierProfile.findOne({ userId });
      defaultStep = 1;
      maxStep = 5;
    } else {
      return res.status(403).json({ error: "Invalid role" });
    }

    if (!profile) {
      // No profile exists yet, return default status
      return res.json({
        isProfileComplete: false,
        profileCompletionStep: defaultStep,
        profile: null,
        role
      });
    }

    res.json({
      isProfileComplete: profile.isProfileComplete,
      profileCompletionStep: profile.profileCompletionStep,
      profile,
      role
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /profile/worker/step - Update worker profile at specific step
router.patch("/worker/step", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "worker") {
      return res.status(403).json({ error: "Not a worker" });
    }

    const { step, data } = req.body;

    if (!step || step < 1 || step > 5) {
      return res.status(400).json({ error: "Invalid step number (1-5)" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Data object required" });
    }

    // Find or create profile
    let profile = await WorkerProfile.findOne({ userId });

    if (!profile) {
      profile = await WorkerProfile.create({ userId });
    }

    // Update profile with step data
    Object.assign(profile, data);

    // Determine next step
    let nextStep = step + 1;
    
    // If step 5, validate all fields before marking complete
    if (step === 5) {
      const isValid = validateWorkerStep5(profile);
      if (isValid) {
        profile.isProfileComplete = true;
        profile.profileCompletionStep = 5;
      } else {
        return res.status(400).json({ 
          error: "All required fields must be completed before finishing profile" 
        });
      }
    } else {
      // Move to next step
      profile.profileCompletionStep = nextStep;
    }

    await profile.save();

    res.json({
      success: true,
      profile,
      profileCompletionStep: profile.profileCompletionStep,
      isProfileComplete: profile.isProfileComplete
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// PATCH /profile/employer/step - Update employer profile at specific step
router.patch("/employer/step", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "employer") {
      return res.status(403).json({ error: "Not an employer" });
    }

    const { step, data } = req.body;

    if (!step || step < 1 || step > 6) {
      return res.status(400).json({ error: "Invalid step number (1-6)" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Data object required" });
    }

    // Find or create profile
    let profile = await EmployerProfile.findOne({ userId });

    if (!profile) {
      profile = await EmployerProfile.create({ userId });
    }

    // Update profile with step data
    Object.assign(profile, data);

    // Determine next step
    let nextStep = step + 1;
    
    // If step 6, validate all fields before marking complete
    if (step === 6) {
      const isValid = validateEmployerStep6(profile);
      if (isValid) {
        profile.isProfileComplete = true;
        profile.profileCompletionStep = 6;
      } else {
        return res.status(400).json({ 
          error: "All required fields must be completed before finishing profile" 
        });
      }
    } else {
      // Move to next step
      profile.profileCompletionStep = nextStep;
    }

    await profile.save();

    res.json({
      success: true,
      profile,
      profileCompletionStep: profile.profileCompletionStep,
      isProfileComplete: profile.isProfileComplete
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Validation function for worker step 5
function validateWorkerStep5(profile) {
  // Check Step 1 fields
  if (!profile.fullName || !profile.aadharNumber || !profile.dob || !profile.gender) {
    return false;
  }

  // Check Step 2 fields
  if (!profile.address || !profile.address.villageOrCity || !profile.address.district || 
      !profile.address.state || !profile.address.pincode) {
    return false;
  }

  // Check Step 3 fields
  if (!profile.jobCategories || profile.jobCategories.length === 0 || 
      !profile.skillLevel || profile.yearsOfExperience === undefined) {
    return false;
  }

  // Check Step 4 fields (bank details)
  if (!profile.bankAccountNumber || !profile.ifscCode || 
      !profile.preferredPaymentMode || profile.preferredPaymentMode === "none") {
    return false;
  }

  // Check Step 5 fields
  if (!profile.readDocsAccepted) {
    return false;
  }

  return true;
}

// PATCH /profile/supplier/step - Update supplier profile at specific step
router.patch("/supplier/step", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "supplier") {
      return res.status(403).json({ error: "Not a supplier" });
    }

    const { step, data } = req.body;

    if (!step || step < 1 || step > 5) {
      return res.status(400).json({ error: "Invalid step number (1-5)" });
    }

    if (!data || typeof data !== "object") {
      return res.status(400).json({ error: "Data object required" });
    }

    // Find or create profile
    let profile = await SupplierProfile.findOne({ userId });

    if (!profile) {
      profile = await SupplierProfile.create({ userId });
    }

    // Handle step 3 products array specially
    if (step === 3 && data.products) {
      // If products array is provided, replace the entire array
      profile.products = data.products;
      // Remove products from data to avoid overwriting
      const { products, ...restData } = data;
      Object.assign(profile, restData);
    } else {
      // Update profile with step data
      Object.assign(profile, data);
    }

    // Determine next step
    let nextStep = step + 1;
    
    // If step 5, validate all fields before marking complete
    if (step === 5) {
      const isValid = validateSupplierStep5(profile);
      if (isValid) {
        profile.isProfileComplete = true;
        profile.profileCompletionStep = 5;
      } else {
        return res.status(400).json({ 
          error: "All required fields must be completed before finishing profile" 
        });
      }
    } else {
      // Move to next step
      profile.profileCompletionStep = nextStep;
    }

    await profile.save();

    res.json({
      success: true,
      profile,
      profileCompletionStep: profile.profileCompletionStep,
      isProfileComplete: profile.isProfileComplete
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Validation function for employer step 6
function validateEmployerStep6(profile) {
  // Check Step 1 fields (Personal Details)
  if (!profile.fullName || !profile.aadharNumber || !profile.dob || !profile.gender) {
    return false;
  }

  // Check Step 2 fields (Address)
  if (!profile.address || !profile.address.villageOrCity || !profile.address.district || 
      !profile.address.state || !profile.address.pincode) {
    return false;
  }

  // Check Step 3 fields (Company Details)
  if (!profile.companyName || !profile.contactNumber) {
    return false;
  }

  // Check Step 4 fields (Bank & Payment)
  if (!profile.bankAccountNumber || !profile.ifscCode || 
      !profile.preferredPaymentMode || profile.preferredPaymentMode === "none") {
    return false;
  }

  // Check Step 5 fields (Wage & Payment Preferences) - Optional but good to have
  // This is optional based on the UI, so we won't make it required

  // Check Step 6 fields (Documents & Agreement)
  if (!profile.readDocsAccepted) {
    return false;
  }

  // Documents are optional but recommended
  // We can make them optional or required based on business logic

  return true;
}

// Validation function for supplier step 5
function validateSupplierStep5(profile) {
  // Check Step 1 fields (Personal & Business Details)
  if (!profile.fullName || !profile.companyName || !profile.mobileNo || 
      !profile.email || !profile.city || !profile.state || !profile.gstNumber || 
      !profile.businessAddress) {
    return false;
  }

  // Check Step 2 fields (Product Categories)
  if (!profile.productCategories || profile.productCategories.length === 0) {
    return false;
  }

  // Check Step 3 fields (Products) - At least one product required
  if (!profile.products || profile.products.length === 0) {
    return false;
  }

  // Validate each product has required fields
  for (const product of profile.products) {
    if (!product.productName || !product.price || !product.unit || !product.minOrderQty) {
      return false;
    }
  }

  // Check Step 4 fields (Business Verification Documents & Bank Details)
  // Required documents
  if (!profile.gstCertificateUrl || !profile.panCardUrl) {
    return false;
  }

  // Bank details for payout
  if (!profile.accountHolderName || !profile.accountNumber || !profile.ifscCode) {
    return false;
  }

  // Verification checkboxes
  if (!profile.documentsConfirmed || !profile.supplierTermsAccepted) {
    return false;
  }

  // Check Step 5 fields (Final Review)
  if (!profile.readDocsAccepted) {
    return false;
  }

  return true;
}

// Middleware to protect routes that require complete profile
export const requireCompleteProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let profile = null;

    if (role === "worker") {
      profile = await WorkerProfile.findOne({ userId });
    } else if (role === "employer") {
      profile = await EmployerProfile.findOne({ userId });
    } else if (role === "supplier") {
      profile = await SupplierProfile.findOne({ userId });
    } else {
      return res.status(403).json({ error: "Invalid role" });
    }

    if (!profile || !profile.isProfileComplete) {
      return res.status(403).json({ 
        error: "Complete your profile to continue",
        profileCompletionStep: profile?.profileCompletionStep || 1,
        isProfileComplete: false
      });
    }

    next();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

export default router;
