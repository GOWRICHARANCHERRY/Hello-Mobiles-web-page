const SENDER_ID = process.env.TWOFACTOR_SENDER_ID || 'HELLOM';

async function sendViaFast2Sms(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) return false;
  try {
    const message = `${otp} is your Hello Mobiles login OTP. Valid for 5 minutes. Do not share it.`;
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${phone}`;
    const resp = await fetch(url);
    const data = await resp.json().catch(() => ({}));
    if (data?.return === true) {
      console.log(`Fast2SMS OTP sent to ${phone}`);
      return true;
    }
    console.error('Fast2SMS rejected:', JSON.stringify(data).slice(0, 200));
    return false;
  } catch (error) {
    console.error('Fast2SMS error:', error.message);
    return false;
  }
}

export async function sendOTP(phone, otp) {
  // Cheapest-first order: Fast2SMS (~₹0.10, free signup credits) before
  // 2factor (~₹0.20). First configured provider that succeeds wins.
  if (await sendViaFast2Sms(phone, otp)) return true;
  return sendVia2Factor(phone, otp);
}

async function sendVia2Factor(phone, otp) {
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
