import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBWC7WCY7YJJxQuyH5RmpYZoyV71LRrH6A",
  authDomain: "hello-mobiles-webpage.firebaseapp.com",
  projectId: "hello-mobiles-webpage",
  storageBucket: "hello-mobiles-webpage.firebasestorage.app",
  messagingSenderId: "500062719083",
  appId: "1:500062719083:web:a28489b0a63f54a654f52e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

let confirmationResult = null;

export async function sendFirebaseOTP(phoneNumber) {
  // Clear any existing reCAPTCHA
  if (window.recaptchaVerifier) {
    try { window.recaptchaVerifier.clear(); } catch(e) {}
    window.recaptchaVerifier = null;
  }

  // Remove old reCAPTCHA iframes
  const oldFrames = document.querySelectorAll('iframe[src*="recaptcha"]');
  oldFrames.forEach(f => f.remove());
  const oldDivs = document.querySelectorAll('.grecaptcha-badge');
  oldDivs.forEach(d => d.remove());

  // Create fresh container
  let container = document.getElementById('recaptcha-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'recaptcha-container';
    document.body.appendChild(container);
  }
  container.innerHTML = '';

  // Create new reCAPTCHA verifier with size normal (visible)
  window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    size: 'normal',
    callback: () => {},
    'expired-callback': () => {
      toast && toast.error('reCAPTCHA expired. Please try again.');
    }
  });

  try {
    await window.recaptchaVerifier.render();
  } catch (e) {
    console.error('reCAPTCHA render error:', e);
  }

  const confirmation = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, window.recaptchaVerifier);
  confirmationResult = confirmation;
  return confirmation;
}

export function getConfirmation() {
  return confirmationResult;
}
