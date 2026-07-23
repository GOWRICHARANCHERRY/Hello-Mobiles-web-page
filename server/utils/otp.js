import https from 'https';

const API_KEY = process.env.TWOFACTOR_API_KEY;
const SENDER_ID = process.env.TWOFACTOR_SENDER_ID || 'HELLOM';
const TEMPLATE = process.env.TWOFACTOR_TEMPLATE || 'Hello Mobiles OTP is {{otp}}. Do not share.';

export async function sendOTP(phone, otp) {
  // 2Factor.in API (free - 30 OTPs/month, no credit card)
  if (API_KEY) {
    try {
      const url = `https://2factor.in/API/V1/${API_KEY}/SMS/+91${phone}/${otp}/${SENDER_ID}`;
      await fetch(url);
      console.log(`SMS OTP sent to ${phone}`);
      return true;
    } catch (error) {
      console.error('2Factor SMS error:', error.message);
    }
  }

  // Fallback: print to console (development)
  console.log(`\n========================================`);
  console.log(`  OTP for +91 ${phone}: ${otp}`);
  console.log(`========================================\n`);
  return true;
}

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
