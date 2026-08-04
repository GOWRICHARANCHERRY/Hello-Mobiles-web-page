import { useState, useRef, useEffect } from 'react';
import { X, Camera, Search, Package, Smartphone, Calendar, CreditCard, MapPin, Hash, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';

function CameraScanModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    let stopped = false;

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        if ('BarcodeDetector' in window) {
          detectorRef.current = new BarcodeDetector({ formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'qr_code'] });
          const detect = async () => {
            if (stopped || !detectorRef.current || !videoRef.current) return;
            try {
              const barcodes = await detectorRef.current.detect(videoRef.current);
              if (barcodes.length > 0) {
                onDetected(barcodes[0].rawValue);
                stop();
                return;
              }
            } catch {}
            rafRef.current = requestAnimationFrame(detect);
          };
          detect();
        }
      } catch {
        toast.error(t('comp.cameraAccessDenied'));
        onClose();
      }
    };

    const stop = () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
      detectorRef.current = null;
    };

    start();
    return stop;
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Camera size={16} /> {t('comp.scanImeiBarcode')}</h3>
          <button onClick={onClose} aria-label="Close scanner" className="p-1 hover:bg-white/20 rounded-full"><X size={16} /></button>
        </div>
        <div className="relative bg-black aspect-video">
          <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-3/4 h-1/3 border-2 border-white/70 rounded-lg relative">
              <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
              <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
              <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
            </div>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-sm text-gray-600">{t('comp.pointCamera')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('comp.autoDetect')}</p>
          {!('BarcodeDetector' in window) && (
            <p className="text-xs text-amber-500 mt-2 bg-amber-50 rounded-lg p-2">{t('comp.autoScanNotSupported')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ImeiScanModal({ open, onClose }) {
  const [imeiInput, setImeiInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) { setImeiInput(''); setResult(null); setSearched(false); setShowCamera(false); }
  }, [open]);

  const searchImei = async (code) => {
    if (!code || code.length < 15) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data } = await api.get(`/products/imei/${code}`);
      setResult(data);
    } catch {
      setResult({ found: false });
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); searchImei(imeiInput); }
  };

  const handleCameraDetected = (code) => {
    setImeiInput(code);
    setShowCamera(false);
    searchImei(code);
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="gold-gradient text-white px-5 py-4 flex items-center justify-between rounded-t-2xl sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Smartphone size={20} />
              </div>
              <div>
                <h2 className="font-bold text-lg">{t('comp.imeiLookup')}</h2>
                <p className="text-white/80 text-xs">{t('comp.imeiLookupSub')}</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close IMEI lookup" className="p-2 hover:bg-white/20 rounded-full"><X size={18} /></button>
          </div>

          <div className="p-5">
            {/* Search bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-5">
              <div className="flex-1 relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={imeiInput}
                  onChange={e => setImeiInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
                  onKeyDown={handleKeyDown}
                  placeholder={t('comp.enterImei')}
                  maxLength={15}
                  className="w-full border-2 border-gold-200 rounded-xl pl-9 pr-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-gold-400 outline-none"
                />
              </div>
              <button onClick={() => searchImei(imeiInput)} disabled={imeiInput.length < 15 || loading}
                className="gold-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto">
                <Search size={14} /> {t('comp.search')}
              </button>
              <button onClick={() => setShowCamera(true)}
                className="bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2 whitespace-nowrap w-full sm:w-auto">
                <Camera size={14} /> {t('comp.scan')}
              </button>
            </div>

            {imeiInput.length > 0 && imeiInput.length < 15 && (
              <p className="text-xs text-amber-500 mb-3">{t('comp.digitsProgress', { count: imeiInput.length })}</p>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-3 border-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">{t('comp.lookingUpImei')}</p>
              </div>
            )}

            {/* Result */}
            {!loading && searched && result && (
              <div className="space-y-4">
                {!result.found ? (
                  <div className="text-center py-10 bg-gray-50 rounded-xl">
                    <AlertCircle size={40} className="text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">{t('comp.imeiNotFound')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('comp.imeiNotRegistered')}</p>
                  </div>
                ) : (
                  <>
                    {/* Product Card */}
                    <div className="bg-gold-50 rounded-xl p-4 border border-gold-200">
                      <div className="flex items-start gap-4">
                        {result.product?.images?.[0] && (
                          <div className="w-20 h-20 rounded-xl bg-white border border-gold-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img src={result.product.images[0]} alt="" width="80" height="80" loading="lazy" className="w-full h-full object-contain p-1" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-xs text-gold-600 font-medium">{result.product?.brand}</p>
                          <h3 className="font-bold text-gray-800">{result.product?.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">{result.product?.category}</p>
                        </div>
                      </div>
                    </div>

                    {/* Variant & Color */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{t('comp.variant')}</p>
                        <p className="text-sm font-bold text-gray-800">{result.variant?.ram} / {result.variant?.storage}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{t('comp.color')}</p>
                        <p className="text-sm font-bold text-gray-800">{result.color?.name}</p>
                      </div>
                    </div>

                    {/* IMEI Details */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-bold text-gray-700">{t('comp.imeiDetails')}</p>
                      </div>
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{t('comp.imeiNumber')}</span>
                          <span className="text-sm font-mono font-bold text-gray-800">{result.imei?.number}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">{t('comp.status')}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${result.imei?.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {result.imei?.status === 'sold' ? t('comp.sold') : t('comp.inStock')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={11} /> {t('comp.addedToStock')}</span>
                          <span className="text-xs text-gray-700">{result.imei?.addedAt ? new Date(result.imei.addedAt).toLocaleString() : '—'}</span>
                        </div>
                        {result.imei?.soldAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Clock size={11} /> {t('comp.soldOn')}</span>
                            <span className="text-xs text-red-600 font-medium">{new Date(result.imei.soldAt).toLocaleString()}</span>
                          </div>
                        )}
                        {result.imei?.soldPrice && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t('comp.soldPrice')}</span>
                            <span className="text-sm font-bold text-gray-800">₹{result.imei.soldPrice?.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{t('comp.sellingPrice')}</p>
                        <p className="text-lg font-bold gold-text">₹{result.variant?.price?.toLocaleString()}</p>
                      </div>
                      <div className="bg-white rounded-xl p-3 border border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">{t('comp.mrp')}</p>
                        <p className="text-lg font-bold text-gray-400 line-through">₹{result.variant?.mrp?.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Order Details (if sold) */}
                    {result.imei?.status === 'sold' && result.order && (
                      <div className="bg-blue-50 rounded-xl border border-blue-200 overflow-hidden">
                        <div className="px-4 py-2.5 bg-blue-100/50 border-b border-blue-200">
                          <p className="text-xs font-bold text-blue-700 flex items-center gap-1"><CreditCard size={12} /> {t('comp.orderDetails')}</p>
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t('comp.orderNumber')}</span>
                            <span className="text-sm font-bold text-blue-700">#{result.order.orderNumber}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t('comp.orderDate')}</span>
                            <span className="text-xs text-gray-700">{new Date(result.order.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t('comp.orderTotal')}</span>
                            <span className="text-sm font-bold text-gray-800">₹{result.order.total?.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">{t('comp.payment')}</span>
                            <span className="text-xs text-gray-700 capitalize">{result.order.paymentMethod === 'cod' ? t('comp.cashOnDelivery') : result.order.paymentMethod}</span>
                          </div>
                          {result.order.shippingAddress && (
                            <div className="pt-2 border-t border-blue-200">
                              <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1 flex items-center gap-1"><MapPin size={10} /> {t('comp.shippingAddress')}</p>
                              <p className="text-xs text-gray-600">{result.order.shippingAddress.name}, {result.order.shippingAddress.street}</p>
                              <p className="text-xs text-gray-600">{result.order.shippingAddress.city}, {result.order.shippingAddress.state} - {result.order.shippingAddress.pincode}</p>
                              <p className="text-xs text-gray-500 mt-1">{t('comp.phoneLabel', { phone: result.order.shippingAddress.phone })}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {!searched && !loading && (
              <div className="text-center py-10 bg-gray-50 rounded-xl">
                <Package size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">{t('comp.enterOrScanImei')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('comp.showsInfo')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <CameraScanModal open={showCamera} onClose={() => setShowCamera(false)} onDetected={handleCameraDetected} />
    </>
  );
}
