// Razorpay Standard Checkout — lazy-loads the checkout script (CSP-whitelisted)
// and opens the payment modal. Resolves with the success payload
// { razorpay_order_id, razorpay_payment_id, razorpay_signature }.
const RAZORPAY_SRC = 'https://checkout.razorpay.com/v1/checkout.js';
const KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const existing = document.getElementById('razorpay-checkout-script');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Razorpay));
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay')));
      return;
    }
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = RAZORPAY_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => {
      script.remove();
      reject(new Error('Failed to load Razorpay checkout'));
    };
    document.body.appendChild(script);
  });
}

export function normalizeContact(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(-10);
}

export function payWithRazorpay({ amount, currency = 'INR', orderId, description = '', prefill = {}, readonly = {}, theme = { color: '#b8860b' } }) {
  return new Promise((resolve, reject) => {
    if (!KEY_ID) return reject(new Error('Payment gateway is not configured'));
    loadRazorpayScript().then((Razorpay) => {
      const rzp = new Razorpay({
        key: KEY_ID,
        amount,
        currency,
        name: 'Hello Mobiles',
        description,
        order_id: orderId,
        prefill,
        readonly,
        theme,
        handler: (response) => resolve(response),
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      });
      rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'Payment failed')));
      rzp.open();
    }).catch(reject);
  });
}

export default payWithRazorpay;
