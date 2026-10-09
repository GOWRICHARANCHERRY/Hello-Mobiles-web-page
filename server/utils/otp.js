const SENDER_ID = process.env.TWOFACTOR_SENDER_ID || 'HELLOM';

export async function sendOTP(phone, otp) {
  // 2Factor.in OTP SMS (~₹0.20/delivered OTP). Reads env lazily (ESM import
  // hoisting runs before dotenv) and verifies the API response — a failed
  // send must return false so callers don't claim success.
  const apiKey = process.env.TWOFACTOR_API_KEY;
  if (!apiKey) {
    console.log(`[OTP] no 2factor key — code for +91 ${phone} not sent`);
    return false;
  }
  try {
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/+91${phone}/${otp}/${SENDER_ID}`;
    const resp = await fetch(url);
    const data = await resp.json().catch(() => ({}));
    if (data?.Status === 'Success') {
      console.log(`SMS OTP sent to ${phone}`);
      return true;
    }
    console.error('2Factor SMS rejected:', JSON.stringify(data).slice(0, 200));
    return false;
  } catch (error) {
    console.error('2Factor SMS error:', error.message);
    return false;
  }
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
