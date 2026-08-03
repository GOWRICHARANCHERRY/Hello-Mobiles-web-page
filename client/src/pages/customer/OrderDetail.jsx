import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Package, Check, Clock, Truck, CheckCircle, XCircle, Printer, RotateCcw, X, Loader, ChevronLeft } from 'lucide-react';

const statusSteps = ['confirmed', 'processing', 'packed', 'shipped', 'delivered'];

const STORE = {
  name: 'Hello Mobiles & Electronics',
  phone: '+91 88868 88128',
  email: 'svlnmobiles12@gmail.com',
  upi: 'svlnmobiles12@ybl',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then(r => { setOrder(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  const refresh = async () => {
    const { data } = await api.get(`/orders/${id}`);
    setOrder(data);
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason });
      toast.success('Order cancelled');
      setShowCancel(false);
      await refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to cancel order');
    }
    setActionLoading(false);
  };

  const handleReturn = async () => {
    setActionLoading(true);
    try {
      await api.post(`/orders/${id}/return`, { reason });
      toast.success('Return request submitted');
      setShowReturn(false);
      await refresh();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to request return');
    }
    setActionLoading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;
  if (!order) return <div className="text-center py-16 text-gray-500">Order not found</div>;

  const currentStep = statusSteps.indexOf(order.orderStatus);
  const canCancel = ['confirmed', 'processing'].includes(order.orderStatus);
  const canReturn = order.orderStatus === 'delivered' && !order.returnRequested;

  const statusMeta = {
    confirmed: { label: 'Order Confirmed', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    processing: { label: 'Processing', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    packed: { label: 'Packed', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    shipped: { label: 'Shipped', icon: Truck, color: 'text-gold-600', bg: 'bg-gold-100' },
    delivered: { label: 'Delivered', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
    cancelled: { label: 'Cancelled', icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' },
  };
  const meta = statusMeta[order.orderStatus] || statusMeta.confirmed;

  const GST_RATE = 18;
  const gstItems = (order.items || []).map(item => {
    const amount = item.price * item.quantity;
    const taxable = Math.round((amount / (1 + GST_RATE / 100)) * 100) / 100;
    const gst = Math.round((amount - taxable) * 100) / 100;
    const cgst = Math.round((gst / 2) * 100) / 100;
    const sgst = Math.round((gst / 2) * 100) / 100;
    return { item, amount, taxable, cgst, sgst };
  });
  const taxableTotal = gstItems.reduce((s, r) => s + r.taxable, 0);
  const cgstTotal = gstItems.reduce((s, r) => s + r.cgst, 0);
  const sgstTotal = gstItems.reduce((s, r) => s + r.sgst, 0);
  const gstTotal = cgstTotal + sgstTotal;

  const fmt2 = (n) => n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const toWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const two = (n) => n < 20 ? ones[n] : (tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : ''));
    const three = (n) => {
      const h = Math.floor(n / 100), r = n % 100;
      return (h ? ones[h] + ' Hundred' + (r ? ' ' : '') : '') + (r ? two(r) : '');
    };
    if (!num) return 'Zero';
    const crore = Math.floor(num / 10000000);
    const lakh = Math.floor((num % 10000000) / 100000);
    const thousand = Math.floor((num % 100000) / 1000);
    const rest = num % 1000;
    let s = '';
    if (crore) s += three(crore) + ' Crore ';
    if (lakh) s += three(lakh) + ' Lakh ';
    if (thousand) s += three(thousand) + ' Thousand ';
    if (rest) s += three(rest);
    return s.trim();
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Link to="/orders" className="flex items-center gap-1 text-gray-600 hover:text-gold-600 mb-4 text-sm print:hidden"><ChevronLeft size={18} /> Back to Orders</Link>

      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
            {order.trackingId && <p className="text-xs text-gold-600 mt-1">Tracking ID: {order.trackingId}</p>}
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${meta.bg} ${meta.color}`}>
            <meta.icon size={20} />
            <span className="font-semibold capitalize">{meta.label}</span>
          </div>
        </div>

        {/* Status Timeline */}
        {order.orderStatus !== 'cancelled' && (
          <div className="flex items-center mt-6">
            {statusSteps.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${i <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {i <= currentStep ? <Check size={14} /> : i + 1}
                </div>
                {i < statusSteps.length - 1 && <div className={`flex-1 h-1 mx-1 ${i < currentStep ? 'bg-green-500' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        )}

        {order.orderStatus === 'cancelled' && order.cancelReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            Cancellation reason: {order.cancelReason}
          </div>
        )}

        {order.returnRequested && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-600">
            Return requested ({order.returnStatus}){order.returnReason ? ` — ${order.returnReason}` : ''}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 bg-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gold-700 transition">
            <Printer size={16} /> Download / Print Invoice
          </button>
          {canCancel && (
            <button onClick={() => setShowCancel(true)}
              className="flex items-center gap-2 border border-red-300 text-red-500 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-50 transition">
              <X size={16} /> Cancel Order
            </button>
          )}
          {canReturn && (
            <button onClick={() => setShowReturn(true)}
              className="flex items-center gap-2 border border-orange-300 text-orange-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-orange-50 transition">
              <RotateCcw size={16} /> Request Return
            </button>
          )}
        </div>
      </div>

      {/* Invoice body (printable) */}
      <div className="bg-white rounded-2xl shadow-sm mt-6 overflow-hidden invoice-print-area select-none" id="invoice">
        <div className="gold-gradient h-1.5"></div>

        {/* Invoice Header */}
        <div className="px-6 md:px-10 pt-8 pb-6 flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img src="/logo.png" alt="Hello Mobile Electronics & Furniture" className="w-12 h-12 rounded-xl object-contain border-2 border-gold-500/30 shadow-md" />
              <div>
                <h2 className="text-xl font-bold gold-text" style={{ fontFamily: 'Playfair Display, serif' }}>HELLO MOBILE ELECTRONICS &amp; FURNITURE</h2>
                <p className="text-[11px] text-gray-400 tracking-widest">MOBILES | ELECTRONICS | FURNITURE | APPLIANCES</p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Stores: Allur &amp; Buchi, Andhra Pradesh</p>
            <p className="text-xs text-gray-500">Phone: {STORE.phone} · {STORE.email}</p>
          </div>
          <div className="text-left md:text-right md:border-l md:border-dashed md:border-gray-300 md:pl-8">
            <p className="text-2xl font-bold text-gray-900 uppercase tracking-wide">Tax Invoice</p>
            <div className="mt-2 space-y-0.5 text-sm">
              <p className="text-gray-500">Invoice No: <span className="font-semibold text-gray-800">#{order.orderNumber}</span></p>
              <p className="text-gray-500">Order ID: <span className="font-semibold text-gray-800">{order._id.slice(-8).toUpperCase()}</span></p>
              <p className="text-gray-500">Date: <span className="font-semibold text-gray-800">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span></p>
              <p className="text-gray-500">Payment: <span className="font-semibold capitalize text-gray-800">{order.paymentMethod?.replace('_', ' ')}</span></p>
              <p className="text-gray-500">Status: <span className={`font-semibold ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-500'}`}>{order.paymentStatus}</span></p>
            </div>
          </div>
        </div>

        {/* Billed To */}
        <div className="mx-6 md:mx-10 px-5 py-4 bg-gold-50/60 border border-gold-200 rounded-xl invoice-no-break">
          <h3 className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-1">Billed To</h3>
          <p className="text-sm font-semibold text-gray-900">{order.shippingAddress?.name}</p>
          <p className="text-xs text-gray-600 mt-0.5">{order.shippingAddress?.street}, {order.shippingAddress?.city}</p>
          <p className="text-xs text-gray-600">{order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
          <p className="text-xs text-gray-600 mt-0.5">Phone: {order.shippingAddress?.phone}</p>
        </div>

        {/* Items Table */}
        <div className="px-6 md:px-10 pt-6 invoice-table overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] text-white uppercase tracking-wide bg-gradient-to-r from-gray-800 to-gray-700">
                <th className="py-2.5 px-3 text-left rounded-l-lg">Item</th>
                <th className="py-2.5 px-3 text-center">Qty</th>
                <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                <th className="py-2.5 px-3 text-right">CGST 9%</th>
                <th className="py-2.5 px-3 text-right">SGST 9%</th>
                <th className="py-2.5 px-3 text-right rounded-r-lg">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {gstItems.map(({ item, amount, taxable, cgst, sgst }, i) => (
                <tr key={i} className={i % 2 ? 'bg-gold-50/40' : ''}>
                  <td className="py-3 px-3">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.variant && (
                      <p className="text-[11px] text-gray-500">
                        {item.variant.color}{item.variant.ram ? ` / ${item.variant.ram}` : ''}{item.variant.storage ? ` / ${item.variant.storage}` : ''}
                        {item.imei ? ` · IMEI ${item.imei}` : ''}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-3 text-center">{item.quantity}</td>
                  <td className="py-3 px-3 text-right">{item.price.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-3 text-right">{fmt2(taxable)}</td>
                  <td className="py-3 px-3 text-right">{fmt2(cgst)}</td>
                  <td className="py-3 px-3 text-right">{fmt2(sgst)}</td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-900">{amount.toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="px-6 md:px-10 pt-6 pb-8 flex flex-col md:flex-row justify-between gap-6 invoice-no-break">
          <div className="flex-1">
            <p className="text-[11px] font-bold text-gray-700 uppercase tracking-widest mb-1.5">Amount in Words</p>
            <p className="text-sm text-gray-700 font-medium bg-gold-50/60 border border-gold-200 rounded-lg px-3 py-2.5">Rupees {toWords(Math.round(order.total))} Only</p>
            <div className="mt-4 text-[11px] text-gray-500 leading-relaxed">
              <p>• GST @18% (CGST 9% + SGST 9%) is included in the product price.</p>
              <p>• Delivery charge of ₹{order.deliveryCharge?.toLocaleString() || 0} is applicable on orders below ₹5,000.</p>
            </div>
          </div>
          <div className="w-full md:w-80">
            <div className="border-2 border-gold-200 rounded-xl overflow-hidden">
              <div className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 text-sm font-bold">Amount Summary</div>
              <div className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Taxable Value</span><span className="font-medium">₹{fmt2(taxableTotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">CGST @ 9%</span><span className="font-medium">₹{fmt2(cgstTotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">SGST @ 9%</span><span className="font-medium">₹{fmt2(sgstTotal)}</span></div>
                <div className="flex justify-between border-t border-dashed border-gray-200 pt-2"><span className="text-gray-700">Subtotal (incl. GST)</span><span className="font-semibold">₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Delivery</span><span className="font-medium">{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge.toLocaleString('en-IN')}`}</span></div>
                {order.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Coupon {order.couponCode}</span><span>-₹{order.couponDiscount.toLocaleString('en-IN')}</span></div>
                )}
                {order.exchangeDetails?.exchangeValue > 0 && (
                  <div className="flex justify-between text-green-600"><span>Exchange</span><span>-₹{order.exchangeDetails.exchangeValue.toLocaleString('en-IN')}</span></div>
                )}
                <div className="flex justify-between items-center border-t-2 border-gray-800 pt-2 mt-1">
                  <span className="font-bold text-gray-900">TOTAL</span>
                  <span className="text-lg font-bold gold-text">₹{order.total?.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 md:px-10 py-5 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500 text-center md:text-left">
              This is a <span className="font-semibold text-gray-700">computer generated invoice</span> and does not require a physical signature.
            </p>
            <div className="text-center">
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide mb-6">Authorised Signatory</p>
              <p className="text-[11px] text-gray-500">Hello Mobiles &amp; Electronics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {showCancel && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowCancel(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Cancel Order</h3>
            <p className="text-sm text-gray-500 mb-4">This order has not been shipped yet. Are you sure you want to cancel?</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for cancellation (optional)"
              className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-gold-400 outline-none" rows={2} />
            <div className="flex gap-3">
              <button onClick={() => setShowCancel(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">Keep Order</button>
              <button onClick={handleCancel} disabled={actionLoading}
                className="flex-1 bg-red-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-1">
                {actionLoading ? <Loader size={16} className="animate-spin" /> : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return modal */}
      {showReturn && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setShowReturn(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-3">Request Return</h3>
            <p className="text-sm text-gray-500 mb-4">Our team will review your return request and contact you shortly.</p>
            <textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Reason for return (required)"
              className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm mb-4 focus:ring-2 focus:ring-gold-400 outline-none" rows={2} />
            <div className="flex gap-3">
              <button onClick={() => setShowReturn(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-50">Back</button>
              <button onClick={handleReturn} disabled={actionLoading}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-semibold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-1">
                {actionLoading ? <Loader size={16} className="animate-spin" /> : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
