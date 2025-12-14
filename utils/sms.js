import axios from "axios";

export const sendOTPviaFast2SMS = async (phone, otp) => {
  console.log(`[SMS] Function called with phone: ${phone}, OTP: ${otp}`);
  console.log(`[SMS] FAST2SMS_MODE: ${process.env.FAST2SMS_MODE}`);
  console.log(`[SMS] FAST2SMS_KEY exists: ${!!process.env.FAST2SMS_KEY}`);
  
  // Check if mock mode is enabled
  if (process.env.FAST2SMS_MODE === "mock") {
    console.log(`[MOCK SMS] OTP ${otp} for ${phone} - NOT SENDING REAL SMS`);
    return { success: true };
  }

  // Check if API key is configured
  if (!process.env.FAST2SMS_KEY) {
    console.error("❌ FAST2SMS_KEY is not configured in environment variables");
    throw new Error("SMS service not configured");
  }

  try {
    // Format phone number: remove +91 prefix and any spaces, keep only digits
    let formattedPhone = phone.replace(/\+91/g, "").replace(/\s/g, "").trim();
    
    // Ensure it's 10 digits
    if (formattedPhone.length !== 10) {
      throw new Error(`Invalid phone number format: ${phone} (got ${formattedPhone.length} digits)`);
    }

    // Fast2SMS API format - route 'q' is for OTP/Quick messages
    const requestPayload = {
      route: "q",
      message: `Your Zogiraa OTP is ${otp}. Valid for 5 minutes.`,
      language: "english",
      numbers: formattedPhone
    };

    console.log(`[SMS] Attempting to send OTP to ${formattedPhone}...`);
    console.log(`[SMS] Request payload:`, { ...requestPayload, message: `Your Zogiraa OTP is ${otp}...` });
    console.log(`[SMS] API Key present:`, process.env.FAST2SMS_KEY ? "Yes (length: " + process.env.FAST2SMS_KEY.length + ")" : "No");

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      requestPayload,
      {
        headers: { 
          authorization: process.env.FAST2SMS_KEY,
          "Content-Type": "application/json"
        }
      }
    );

    console.log(`[SMS] Response status:`, response.status);
    console.log(`[SMS] Response data:`, JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.return) {
      if (response.data.return === true) {
        console.log(`✅ [SMS] OTP successfully sent to ${formattedPhone}`);
        return { success: true, data: response.data };
      } else {
        console.error(`❌ [SMS] Fast2SMS returned false. Message:`, response.data.message);
        throw new Error(response.data.message || "Failed to send SMS");
      }
    } else {
      console.warn(`⚠️ [SMS] Unexpected response format:`, response.data);
      return { success: true, data: response.data };
    }
  } catch (error) {
    console.error("❌ [SMS Error] Failed to send OTP:");
    console.error("   Error message:", error.message);
    console.error("   Response status:", error.response?.status);
    console.error("   Response data:", JSON.stringify(error.response?.data, null, 2));
    console.error("   Full error:", error);
    throw error;
  }
};