import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, Save, Package, Upload, Search, ChevronDown, GripVertical, Filter, Copy, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import ImeiScanModal from '../../components/ImeiScanModal';

const defaultCategories = ['Mobiles', 'TVs', 'Smart Watches', 'Earbuds', 'Laptops', 'Home Appliances', 'Furniture', 'Accessories'];

const emptySpecs = [
  { key: 'RAM', value: '' },
  { key: 'Storage', value: '' },
  { key: 'Screen Size', value: '' },
  { key: 'Color', value: '' },
];

function Autocomplete({ label, value, onChange, fetchUrl, required }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(value || '');
  const [options, setOptions] = useState([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSearch = async (q) => {
    setQuery(q);
    if (q.length < 1) { setOptions([]); return; }
    setLoading(true);
    try {
      const { data } = await api.get(`${fetchUrl}?q=${encodeURIComponent(q)}`);
      setOptions(data);
      setShow(true);
    } catch { setOptions([]); }
    setLoading(false);
  };

  const handleSelect = (val) => {
    setQuery(val);
    onChange(val);
    setShow(false);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setIsAdding(true);
    setOptions([]);
  };

  const handleSaveNew = () => {
    if (query.trim()) {
      onChange(query.trim());
      setShow(false);
      setIsAdding(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label} {required && '*'}</label>
      <div className="flex">
        <input
          value={query}
          onChange={e => { handleSearch(e.target.value); setIsAdding(false); }}
          onFocus={() => { if (query.length >= 1) handleSearch(query); }}
          placeholder={t('admin2.autocomplete.searchOrType', { label: label.toLowerCase() })}
          className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50"
        />
      </div>
      {show && !isAdding && (
        <div className="absolute z-20 w-full bg-white border-2 border-gold-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
          <button onClick={handleAddNew}
            className="w-full text-left px-3 py-2 text-sm text-gold-600 font-semibold hover:bg-gold-50 border-b border-gold-100 flex items-center gap-2">
            <Plus size={14} /> {t('admin2.autocomplete.addNew', { query })}
          </button>
          {loading && <div className="px-3 py-2 text-sm text-gray-400">Searching...</div>}
          {!loading && options.filter(o => o !== query).length === 0 && query.length >= 1 && (
            <div className="px-3 py-2 text-sm text-gray-400">No results found</div>
          )}
          {options.filter(o => o !== query).map((opt, i) => (
            <button key={i} onClick={() => handleSelect(opt)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gold-50 flex items-center gap-2">
              <Search size={12} className="text-gray-400" /> {opt}
            </button>
          ))}
        </div>
      )}
      {isAdding && (
        <div className="absolute z-20 w-full bg-white border-2 border-gold-200 rounded-lg mt-1 p-3 shadow-lg">
          <p className="text-xs text-gray-500 mb-2">Adding new: "{query}"</p>
          <div className="flex gap-2">
            <button onClick={handleSaveNew} className="flex-1 bg-gold-600 text-white text-xs py-1.5 rounded-lg hover:bg-gold-700">Confirm Add</button>
            <button onClick={() => { setIsAdding(false); setQuery(''); onChange(''); }} className="flex-1 border border-gray-300 text-xs py-1.5 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageUploader({ images, onChange }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const uploadFiles = async (files) => {
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('Please select image files only'); return; }
    if (imageFiles.some(f => f.size > 5 * 1024 * 1024)) { toast.error('Each image must be under 5MB'); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      imageFiles.forEach(f => formData.append('images', f));
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const newUrls = data.urls;
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} image(s) uploaded!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) files.push(items[i].getAsFile());
    }
    if (files.length > 0) uploadFiles(files);
  };

  const handleUrlAdd = () => {
    const url = prompt('Enter image URL:');
    if (url && url.trim()) onChange([...images, url.trim()]);
  };

  const removeImage = (index) => onChange(images.filter((_, i) => i !== index));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Product Images</label>

      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onPaste={handlePaste}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragging ? 'border-gold-500 bg-gold-50' : 'border-gray-300 hover:border-gold-400 hover:bg-gold-50/50'}`}
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => uploadFiles(e.target.files)} />
        <Upload size={32} className={`mx-auto mb-2 ${dragging ? 'text-gold-600' : 'text-gray-400'}`} />
        {uploading ? (
          <p className="text-sm text-gold-600 font-medium">Uploading...</p>
        ) : (
          <>
            <p className="text-sm font-medium text-gray-600">Drag & drop images here, click to browse, or Ctrl+V to paste</p>
            <p className="text-xs text-gray-400 mt-1">Supports JPG, PNG, WebP, GIF (max 5MB each)</p>
          </>
        )}
      </div>

      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mt-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img src={img} alt="" className="w-20 h-20 rounded-lg object-contain bg-gray-100 border-2 border-gold-200" />
              <button onClick={() => removeImage(i)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
              {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-gold-600 text-white text-[9px] text-center rounded-b-lg">Main</span>}
            </div>
          ))}
          <button onClick={handleUrlAdd}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-gold-300 flex flex-col items-center justify-center text-gold-600 hover:bg-gold-50 transition">
            <Plus size={20} />
            <span className="text-[9px] mt-1">Add URL</span>
          </button>
        </div>
      )}
    </div>
  );
}

const specOptions = {
  'RAM': ['4 GB', '6 GB', '8 GB', '12 GB', '16 GB', '32 GB'],
  'Storage': ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'],
  'Screen Size': ['4.7 inch', '5.5 inch', '6.1 inch', '6.5 inch', '6.7 inch', '6.8 inch', '7.6 inch', '10.2 inch', '11 inch', '13.3 inch', '14 inch', '15.6 inch', '32 inch', '40 inch', '43 inch', '50 inch', '55 inch', '65 inch', '75 inch'],
  'Color': ['Black', 'White', 'Blue', 'Green', 'Red', 'Silver', 'Gold', 'Purple', 'Gray', 'Titanium', 'Natural Titanium', 'Natural Silver', 'Cobalt Violet', 'Fusion Purple', 'Asteroid Black', 'Rock Grey', 'Bright Red'],
  'Battery': ['3000 mAh', '4000 mAh', '4500 mAh', '5000 mAh', '5400 mAh', '6000 mAh', '41 Wh', '50 Wh', '54 Wh', '61 Wh', '72 Wh', '6 hrs', '8 hrs', '10 hrs', '12 hrs', '30 hrs with case'],
  'Processor': ['Snapdragon 8 Gen 3', 'Snapdragon 8 Gen 2', 'Snapdragon 7s Gen 2', 'Snapdragon 6 Gen 1', 'Dimensity 9300', 'Dimensity 8200', 'Dimensity 7200', 'A17 Pro', 'A16 Bionic', 'A15 Bionic', 'Exynos 2400', 'Exynos 1380', 'Intel Core i5', 'Intel Core i7', 'Intel Core i9', 'Apple M2', 'Apple M3'],
  'Camera': ['12 MP', '48 MP', '50 MP', '64 MP', '108 MP', '200 MP', '50 MP ZEISS', '48 MP + 12 MP', '50 MP + 12 MP + 10 MP'],
  'OS': ['Android 14', 'Android 13', 'iOS 17', 'iOS 16', 'HarmonyOS 4', 'One UI 6', 'MIUI 14', 'Funtouch OS 14', 'ColorOS 14', 'Windows 11', 'Windows 10', 'macOS Sonoma', 'Tizen', 'Google TV', 'webOS'],
  'Weight': ['150 g', '170 g', '180 g', '190 g', '200 g', '210 g', '220 g', '230 g', '250 g', '300 g', '400 g', '500 g', '1 kg', '1.5 kg', '2 kg'],
  'Warranty': ['6 Months', '1 Year', '2 Years', '3 Years', '5 Years', 'Lifetime'],
  'Display': ['LCD', 'AMOLED', 'Super AMOLED', 'OLED', 'LTPO AMOLED', 'Retina Display', 'Mini LED', 'IPS LCD', '120Hz', '90Hz', '60Hz'],
  'Connectivity': ['5G', '4G LTE', 'Wi-Fi 6', 'Wi-Fi 6E', 'Bluetooth 5.3', 'Bluetooth 5.2', 'NFC', 'USB-C', 'Lightning', 'GPS'],
  'Graphics': ['Intel Iris Xe', 'NVIDIA RTX 4060', 'NVIDIA RTX 4070', 'NVIDIA RTX 4080', 'AMD Radeon', 'Apple GPU'],
  'Capacity': ['0.75 Ton', '1 Ton', '1.5 Ton', '2 Ton', '2.5 Ton', '8 kg', '9 kg', '10 kg'],
  'Rating': ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'],
  'Type': ['Split AC', 'Window AC', 'Portable AC', 'Inverter AC', 'Side by Side', 'Double Door', 'Single Door', 'French Door'],
  'Resolution': ['HD', 'Full HD', '2K', '4K UHD', '4K OLED', '8K'],
  'HDR': ['HDR10', 'HDR10+', 'Dolby Vision', 'HLG'],
};

const specKeyOptions = Object.keys(specOptions);

function SpecKeyDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = specKeyOptions.filter(k => k.toLowerCase().includes(filter.toLowerCase()));
  const isCustom = value && !specKeyOptions.includes(value);

  return (
    <div className="relative flex-1">
      <div className="flex items-center border-2 border-gold-200 rounded-lg bg-gold-50/50 focus-within:ring-2 focus-within:ring-gold-400">
        <input value={open ? filter : value} onChange={e => { setFilter(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setFilter(''); }}
          placeholder="Select spec..."
          className="flex-1 px-3 py-1.5 text-sm bg-transparent outline-none" />
        <button type="button" onClick={() => setOpen(!open)} className="px-2 text-gray-400 hover:text-gold-600">
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-30 w-full bg-white border-2 border-gold-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filtered.length === 0 && filter && (
            <button onClick={() => { onChange(filter); setOpen(false); setFilter(''); }}
              className="w-full text-left px-3 py-2 text-sm text-gold-600 font-semibold hover:bg-gold-50 border-b border-gold-100">
              Add Custom: "{filter}"
            </button>
          )}
          {filtered.map(k => (
            <button key={k} onClick={() => { onChange(k); setOpen(false); setFilter(''); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gold-50 flex items-center gap-2 ${value === k ? 'bg-gold-100 text-gold-700 font-medium' : ''}`}>
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SpecValueDropdown({ specKey, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const options = specKey && specOptions[specKey] ? specOptions[specKey] : [];
  const filtered = options.filter(v => v.toLowerCase().includes(filter.toLowerCase()));
  const isCustom = value && !options.includes(value);

  return (
    <div className="relative flex-1">
      <div className="flex items-center border-2 border-gold-200 rounded-lg bg-gold-50/50 focus-within:ring-2 focus-within:ring-gold-400">
        <input value={open ? filter : value} onChange={e => { setFilter(e.target.value); if (!open) setOpen(true); }}
          onFocus={() => { setOpen(true); setFilter(''); }}
          placeholder={options.length ? "Select value..." : "Type value..."}
          className="flex-1 px-3 py-1.5 text-sm bg-transparent outline-none" />
        <button type="button" onClick={() => setOpen(!open)} className="px-2 text-gray-400 hover:text-gold-600">
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="absolute z-30 w-full bg-white border-2 border-gold-200 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
          {filtered.length === 0 && filter && (
            <button onClick={() => { onChange(filter); setOpen(false); setFilter(''); }}
              className="w-full text-left px-3 py-2 text-sm text-gold-600 font-semibold hover:bg-gold-50 border-b border-gold-100">
              Add Custom: "{filter}"
            </button>
          )}
          {filtered.map(v => (
            <button key={v} onClick={() => { onChange(v); setOpen(false); setFilter(''); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-gold-50 flex items-center gap-2 ${value === v ? 'bg-gold-100 text-gold-700 font-medium' : ''}`}>
              {v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicSpecs({ specs, onChange }) {
  const addSpec = () => onChange([...specs, { key: '', value: '' }]);
  const removeSpec = (index) => onChange(specs.filter((_, i) => i !== index));
  const updateSpec = (index, field, val) => {
    const updated = specs.map((s, i) => i === index ? { ...s, [field]: val } : s);
    onChange(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">Specifications</label>
        <button type="button" onClick={addSpec} className="text-gold-600 text-xs flex items-center gap-1 hover:underline">
          <Plus size={12} /> Add Spec
        </button>
      </div>
      <div className="space-y-2">
        {specs.map((spec, i) => (
          <div key={i} className="flex gap-2 items-center">
            <GripVertical size={14} className="text-gray-300 cursor-grab flex-shrink-0" />
            <SpecKeyDropdown value={spec.key} onChange={val => {
              updateSpec(i, 'key', val);
              if (specOptions[val]) updateSpec(i, 'value', '');
            }} />
            <SpecValueDropdown specKey={spec.key} value={spec.value} onChange={val => updateSpec(i, 'value', val)} />
            <button type="button" onClick={() => removeSpec(i)}
              className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

const defaultVariant = { ram: '', storage: '', price: '', mrp: '', sku: '', colors: [{ name: '', stock: 0, image: '', imei: [] }] };

const colorPreset = ['Black', 'White', 'Blue', 'Green', 'Red', 'Gold', 'Silver', 'Purple', 'Gray', 'Pink', 'Orange', 'Navy', 'Beige', 'Bronze', 'Cream', 'Coral', 'Teal'];

function ScanModal({ open, onClose, onDetected }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const rafRef = useRef(null);

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
      } catch (err) {
        toast.error('Camera access denied.');
        onClose();
      }
    };

    const stop = () => {
      stopped = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      detectorRef.current = null;
    };

    start();
    return stop;
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Camera size={16} /> Scan IMEI Barcode</h3>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full"><X size={16} /></button>
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
          <p className="text-sm text-gray-600">Point camera at the barcode</p>
          <p className="text-xs text-gray-400 mt-1">It will scan automatically</p>
          {!('BarcodeDetector' in window) && (
            <p className="text-xs text-amber-500 mt-2 bg-amber-50 rounded-lg p-2">Auto-scan not supported. Type IMEI manually.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImeiManager({ color, variantIndex, colorIndex, onAddImei, onRemoveImei }) {
  const [imeiInput, setImeiInput] = useState('');
  const [showScan, setShowScan] = useState(false);
  const imeiList = color.imei || [];
  const imeiNumbers = imeiList.map(e => typeof e === 'string' ? e : e.number || '');
  const stock = color.stock || 0;
  const isFull = imeiNumbers.length >= stock && stock > 0;

  const handleAdd = () => {
    if (imeiInput.trim()) {
      if (isFull) { toast.error(`Already have ${stock} IMEIs — matches stock`); return; }
      onAddImei(variantIndex, colorIndex, imeiInput);
      setImeiInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
  };

  const handleScanDetected = (code) => {
    if (isFull) { toast.success(`Already have ${stock} IMEIs — matches stock`); setShowScan(false); return; }
    onAddImei(variantIndex, colorIndex, code);
    toast.success('IMEI scanned!');
    setShowScan(false);
  };

  const progressPct = stock > 0 ? Math.min((imeiNumbers.length / stock) * 100, 100) : 0;

  return (
    <div className="space-y-2 border-t border-dashed border-gold-200 pt-2">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] font-semibold text-gold-700">IMEI Numbers</p>
          <p className="text-[10px] font-bold">
            <span className={isFull ? 'text-green-600' : imeiNumbers.length > 0 ? 'text-amber-600' : 'text-gray-400'}>
              {imeiNumbers.length}
            </span>
            <span className="text-gray-400"> / {stock}</span>
            {isFull && <span className="text-green-600 ml-1">Complete</span>}
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${isFull ? 'bg-green-500' : imeiList.length > 0 ? 'bg-amber-500' : 'bg-gold-400'}`}
            style={{ width: `${progressPct}%` }}></div>
        </div>
      </div>

      {/* Input row */}
      {!isFull && (
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={imeiInput}
            onChange={e => setImeiInput(e.target.value.replace(/[^0-9]/g, '').slice(0, 15))}
            onKeyDown={handleKeyDown}
            placeholder="Type 15-digit IMEI & press Enter"
            maxLength={15}
            className="flex-1 border border-gold-300 rounded px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-400 outline-none font-mono bg-gold-50/50"
          />
          <button type="button" onClick={handleAdd} disabled={!imeiInput.trim() || imeiInput.length !== 15}
            className="bg-gold-600 text-white text-[10px] px-2.5 py-1.5 rounded hover:bg-gold-700 disabled:opacity-40 disabled:cursor-not-allowed font-semibold whitespace-nowrap">
            + Add
          </button>
          <button type="button" onClick={() => setShowScan(true)}
            className="flex items-center gap-1 bg-blue-500 text-white text-[10px] px-2.5 py-1.5 rounded hover:bg-blue-600 font-semibold whitespace-nowrap">
            <Camera size={11} /> Scan
          </button>
        </div>
      )}

      {imeiInput.length > 0 && imeiInput.length < 15 && (
        <p className="text-[10px] text-amber-500">{imeiInput.length}/15 digits — need {15 - imeiInput.length} more</p>
      )}

      {/* IMEI list - all visible */}
      {imeiNumbers.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {imeiList.map((entry, idx) => {
            const num = typeof entry === 'string' ? entry : entry.number || '';
            const addedAt = typeof entry === 'object' && entry.addedAt ? new Date(entry.addedAt).toLocaleString() : '';
            return (
              <div key={idx} className={`flex items-center justify-between border rounded px-2 py-1 ${typeof entry === 'object' && entry.status === 'sold' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono text-green-800">{idx + 1}. {num}</span>
                  {addedAt && <span className="text-[9px] text-gray-400 ml-2">Added: {addedAt}</span>}
                  {typeof entry === 'object' && entry.status === 'sold' && (
                    <span className="text-[9px] text-red-500 ml-2">SOLD{entry.soldAt ? ` ${new Date(entry.soldAt).toLocaleString()}` : ''}</span>
                  )}
                </div>
                {typeof entry === 'object' && entry.status !== 'sold' && (
                  <button type="button" onClick={() => onRemoveImei(variantIndex, colorIndex, idx)}
                    className="text-red-400 hover:text-red-600 p-0.5 ml-2 flex-shrink-0">
                    <X size={11} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isFull && (
        <p className="text-[10px] text-green-600 font-semibold bg-green-50 rounded-lg p-1.5 text-center">
          All {stock} IMEI numbers added. Stock is complete.
        </p>
      )}

      <ScanModal open={showScan} onClose={() => setShowScan(false)} onDetected={handleScanDetected} />
    </div>
  );
}

function VariantManager({ variants, onChange, basePrice, baseMrp, baseStock, category }) {
  const isMobiles = category === 'Mobiles';
  const addVariant = () => onChange([...variants, { ...defaultVariant, price: basePrice || '', mrp: baseMrp || '' }]);
  const removeVariant = (index) => onChange(variants.filter((_, i) => i !== index));
  const duplicateVariant = (index) => {
    const copy = { ...variants[index], sku: '', colors: variants[index].colors.map(c => ({ ...c, stock: 0, imei: [] })) };
    const newVariants = [...variants];
    newVariants.splice(index + 1, 0, copy);
    onChange(newVariants);
  };

  const updateVariant = (index, field, val) => {
    onChange(variants.map((v, i) => i === index ? { ...v, [field]: val } : v));
  };

  const addColorToVariant = (variantIndex) => {
    const v = variants[variantIndex];
    const newColors = [...(v.colors || []), { name: '', stock: 0, image: '', imei: [] }];
    updateVariant(variantIndex, 'colors', newColors);
  };

  const removeColorFromVariant = (variantIndex, colorIndex) => {
    const v = variants[variantIndex];
    const newColors = v.colors.filter((_, i) => i !== colorIndex);
    updateVariant(variantIndex, 'colors', newColors.length > 0 ? newColors : [{ name: '', stock: 0, image: '', imei: [] }]);
  };

  const updateColor = (variantIndex, colorIndex, field, val) => {
    const v = variants[variantIndex];
    const newColors = v.colors.map((c, i) => i === colorIndex ? { ...c, [field]: val } : c);
    updateVariant(variantIndex, 'colors', newColors);
  };

  const addAllColorsToVariant = (variantIndex) => {
    const v = variants[variantIndex];
    const existingNames = (v.colors || []).map(c => c.name.toLowerCase());
    const newColors = colorPreset.filter(c => !existingNames.includes(c.toLowerCase())).map(c => ({ name: c, stock: 0, image: '', imei: [] }));
    updateVariant(variantIndex, 'colors', [...(v.colors || []), ...newColors]);
  };

  const totalVariantStock = (v) => (v.colors || []).reduce((s, c) => s + (c.stock || 0), 0);

  const addImei = (variantIndex, colorIndex, imeiStr) => {
    const v = variants[variantIndex];
    const c = v.colors[colorIndex];
    const trimmed = imeiStr.trim().replace(/\s+/g, '');
    if (!trimmed) return;
    if (!/^\d{15}$/.test(trimmed)) { toast.error('IMEI must be exactly 15 digits'); return; }
    const localImei = (c.imei || []).map(x => (typeof x === 'string' ? x : x.number) || '');
    if (localImei.includes(trimmed)) { toast.error('Duplicate IMEI in this color'); return; }
    for (const ov of variants) {
      for (const oc of (ov.colors || [])) {
        const allImei = (oc.imei || []).map(x => (typeof x === 'string' ? x : x.number) || '');
        if (allImei.includes(trimmed)) {
          toast.error(`IMEI already used in "${oc.name || 'Unnamed'}" (${ov.ram || ''}/${ov.storage || ''})`);
          return;
        }
      }
    }
    const entry = { number: trimmed, addedAt: new Date().toISOString(), status: 'in_stock' };
    const newImeiList = [...(c.imei || []), entry];
    const newColors = v.colors.map((col, ci) => ci === colorIndex ? { ...col, imei: newImeiList, stock: newImeiList.length } : col);
    updateVariant(variantIndex, 'colors', newColors);
  };

  const removeImei = (variantIndex, colorIndex, imeiIndex) => {
    const v = variants[variantIndex];
    const c = v.colors[colorIndex];
    const newImei = (c.imei || []).filter((_, idx) => idx !== imeiIndex);
    const newColors = v.colors.map((col, ci) => ci === colorIndex ? { ...col, imei: newImei, stock: newImei.length } : col);
    updateVariant(variantIndex, 'colors', newColors);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          Variants {variants.length > 0 && <span className="text-gray-400 font-normal">({variants.length})</span>}
        </label>
        <button type="button" onClick={addVariant} className="text-gold-600 text-xs flex items-center gap-1 hover:underline">
          <Plus size={12} /> Add Variant
        </button>
      </div>
      <p className="text-xs text-gray-400 mb-3">Each variant = one RAM/Storage combo with its own price. Add colors within each variant for stock tracking.{isMobiles && ' IMEI is required for each unit.'}</p>

      {variants.length === 0 && (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
          <Package size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">No variants added yet</p>
          <p className="text-xs text-gray-400 mt-1">If this product comes in different RAM/storage options, add variants</p>
          <button type="button" onClick={addVariant} className="mt-3 text-gold-600 text-sm font-medium hover:underline">+ Add First Variant</button>
        </div>
      )}

      {variants.length > 0 && (
        <div className="space-y-4">
          {variants.map((variant, i) => {
            const vStock = totalVariantStock(variant);
            const totalImei = (variant.colors || []).reduce((s, c) => s + (c.imei?.length || 0), 0);
            return (
              <div key={i} className="border-2 border-gold-200 rounded-xl bg-gold-50/30 overflow-hidden">
                <div className="flex items-center justify-between p-3 bg-gold-100/50 border-b border-gold-200">
                  <span className="text-xs font-bold text-gold-700">
                    Variant {i + 1}{variant.ram ? ` — ${variant.ram}` : ''}{variant.storage ? ` / ${variant.storage}` : ''} {variant.price ? `₹${Number(variant.price).toLocaleString()}` : ''} {variant.colors?.length > 0 ? `| ${vStock} stock` : ''}
                  </span>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => duplicateVariant(i)} className="text-blue-500 hover:text-blue-600 p-1" title="Duplicate"><Copy size={14} /></button>
                    <button type="button" onClick={() => removeVariant(i)} className="text-red-400 hover:text-red-600 p-1" title="Remove"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-3">
                    <select value={variant.ram} onChange={e => updateVariant(i, 'ram', e.target.value)}
                      className="border-2 border-gold-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gold-400 outline-none bg-white">
                      <option value="">RAM</option>
                      {['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select value={variant.storage} onChange={e => updateVariant(i, 'storage', e.target.value)}
                      className="border-2 border-gold-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gold-400 outline-none bg-white">
                      <option value="">Storage</option>
                      {['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="number" value={variant.price} onChange={e => updateVariant(i, 'price', e.target.value)} placeholder="Price ₹"
                      className="border-2 border-gold-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gold-400 outline-none bg-white" />
                    <input type="number" value={variant.mrp} onChange={e => updateVariant(i, 'mrp', e.target.value)} placeholder="MRP ₹"
                      className="border-2 border-gold-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gold-400 outline-none bg-white" />
                    <input value={variant.sku} onChange={e => updateVariant(i, 'sku', e.target.value)} placeholder="SKU (optional)"
                      className="border-2 border-gold-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-gold-400 outline-none bg-white" />
                  </div>

                  <div className="bg-white rounded-lg border border-gold-200 p-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-600">Colors & Stock {isMobiles && <span className="text-gray-400 font-normal">(+ IMEI for each unit)</span>}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => addAllColorsToVariant(i)} className="text-[10px] text-blue-600 hover:text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-50">
                          + All Preset Colors
                        </button>
                        <button type="button" onClick={() => addColorToVariant(i)} className="text-[10px] text-gold-600 hover:text-gold-700 border border-gold-200 rounded px-1.5 py-0.5 hover:bg-gold-50">
                          + Custom Color
                        </button>
                      </div>
                    </div>
                    {(variant.colors || []).length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">No colors added. Add colors to track stock per color.</p>
                    )}
                    <div className="space-y-2">
                      {(variant.colors || []).map((color, ci) => (
                        <div key={ci} className="border border-gray-100 rounded-lg p-2 bg-gray-50/50">
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                list={`color-list-${i}-${ci}`}
                                value={color.name}
                                onChange={e => updateColor(i, ci, 'name', e.target.value)}
                                placeholder="Color name"
                                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-gold-400 outline-none bg-white"
                              />
                              <datalist id={`color-list-${i}-${ci}`}>
                                {colorPreset.map(c => <option key={c} value={c} />)}
                              </datalist>
                            </div>
                            {isMobiles ? (
                              <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded px-2 py-1 min-w-[72px] justify-center">
                                <span className="text-[10px] text-green-600">Stock:</span>
                                <span className="text-xs font-bold text-green-700">{color.imei?.length || 0}</span>
                              </div>
                            ) : (
                              <input type="number" value={color.stock} onChange={e => updateColor(i, ci, 'stock', Number(e.target.value))}
                                placeholder="Stock" min="0"
                                className="w-20 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-gold-400 outline-none" />
                            )}
                            <input value={color.image} onChange={e => updateColor(i, ci, 'image', e.target.value)}
                              placeholder="Image URL (optional)"
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-gold-400 outline-none" />
                            <button type="button" onClick={() => removeColorFromVariant(i, ci)} className="text-red-400 hover:text-red-600 p-0.5 flex-shrink-0">
                              <Trash2 size={12} />
                            </button>
                          </div>

                          {isMobiles && (
                            <div className="mt-2">
                              <ImeiManager color={color} variantIndex={i} colorIndex={ci} onAddImei={addImei} onRemoveImei={removeImei} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [showImeiScan, setShowImeiScan] = useState(false);
  const [form, setForm] = useState({
    name: '', brand: '', category: 'Mobiles', price: '', mrp: '', description: '',
    specifications: emptySpecs.map(s => ({ ...s })),
    stock: 0, emiAvailable: true, exchangeAvailable: true,
    isFeatured: false, isNewArrival: false, isOnOffer: false, images: [], variants: [],
  });

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => {
    api.get('/products').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const specsToMap = (specs) => {
    const map = {};
    specs.forEach(s => { if (s.key.trim()) map[s.key.trim()] = s.value; });
    return map;
  };

  const mapToSpecs = (specMap) => {
    if (!specMap || typeof specMap !== 'object') return emptySpecs.map(s => ({ ...s }));
    const entries = Object.entries(specMap);
    if (entries.length === 0) return emptySpecs.map(s => ({ ...s }));
    return entries.map(([key, value]) => ({ key, value: String(value || '') }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.brand.trim()) return toast.error('Brand is required');
    if (!form.price || form.price <= 0) return toast.error('Valid price is required');

    if (form.category === 'Mobiles' && form.variants?.length > 0) {
      for (const v of form.variants) {
        for (const c of (v.colors || [])) {
          const imeiCount = c.imei?.length || 0;
          if (c.stock > 0 && imeiCount !== c.stock) {
            return toast.error(`IMEI count (${imeiCount}) must match stock (${c.stock}) for ${c.name || 'Unnamed'} ${v.ram || ''}/${v.storage || ''}`);
          }
        }
      }
    }

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        mrp: Number(form.mrp || form.price),
        stock: Number(form.stock),
        specifications: specsToMap(form.specifications),
        variants: (form.variants || []).map(v => ({
          ram: v.ram || '',
          storage: v.storage || '',
          price: Number(v.price || 0),
          mrp: Number(v.mrp || 0),
          sku: v.sku || '',
          colors: (v.colors || []).map(c => ({
            name: c.name || '',
            stock: Number(c.stock || 0),
            image: c.image || '',
            imei: c.imei || [],
          })),
        })),
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        toast.success('Product updated!');
      } else {
        await api.post('/products', payload);
        toast.success('Product created!');
      }
      setShowModal(false);
      setEditingId(null);
      setForm({
        name: '', brand: '', category: 'Mobiles', price: '', mrp: '', description: '',
        specifications: emptySpecs.map(s => ({ ...s })),
        stock: 0, emiAvailable: true, exchangeAvailable: true,
        isFeatured: false, isNewArrival: false, isOnOffer: false, images: [], variants: [],
      });
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setForm({
      ...product,
      price: product.price || '',
      mrp: product.mrp || '',
      stock: product.stock || 0,
      specifications: mapToSpecs(product.specifications),
      images: product.images || [],
      variants: (product.variants || []).map(v => ({
        _id: v._id,
        ram: v.ram || '',
        storage: v.storage || '',
        price: v.price || '',
        mrp: v.mrp || '',
        sku: v.sku || '',
        colors: (v.colors || []).map(c => ({
          _id: c._id,
          name: c.name || '',
          stock: c.stock || 0,
          image: c.image || '',
          imei: c.imei || [],
        })),
      })),
    });
    setEditingId(product._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted!');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    if (filterStatus === 'featured' && !p.isFeatured) return false;
    if (filterStatus === 'new' && !p.isNewArrival) return false;
    if (filterStatus === 'offer' && !p.isOnOffer) return false;
    const totalStock = p.variants?.length > 0 ? p.variants.reduce((s, v) => s + (v.colors?.reduce((cs, c) => cs + (c.stock || 0), 0) || 0), 0) : p.stock;
    if (filterStock === 'low' && totalStock > 5) return false;
    if (filterStock === 'out' && totalStock > 0) return false;
    if (filterStock === 'in' && totalStock <= 0) return false;
    return true;
  });

  const hasFilters = search || filterCategory || filterBrand || filterStatus || filterStock;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products ({filtered.length}{hasFilters ? ` of ${products.length}` : ''})</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImeiScan(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition shadow-lg">
            <Camera size={16} /> Scan IMEI
          </button>
          <button onClick={() => {
          setForm({
            name: '', brand: '', category: 'Mobiles', price: '', mrp: '', description: '',
            specifications: emptySpecs.map(s => ({ ...s })),
            stock: 0, emiAvailable: true, exchangeAvailable: true,
            isFeatured: false, isNewArrival: false, isOnOffer: false, images: [], variants: [],
          });
          setEditingId(null);
          setShowModal(true);
        }}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition shadow-lg">
          <Plus size={16} /> Add Product
        </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 gold-border">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gold-600" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterBrand(''); setFilterStatus(''); setFilterStock(''); }}
              className="text-xs text-red-500 hover:text-red-600 ml-2 underline">Clear All</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or brand..."
              className="w-full pl-9 pr-3 py-2 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Status</option>
            <option value="featured">Featured</option>
            <option value="new">New Arrival</option>
            <option value="offer">On Offer</option>
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Stock</option>
            <option value="low">Low Stock (≤5)</option>
            <option value="out">Out of Stock</option>
            <option value="in">In Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden gold-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gold-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Product</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Category</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Price</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">MRP</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Stock</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Variants</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Status</th>
                <th className="text-left py-3 px-4 text-gray-700 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">No products match your filters</td></tr>
              ) : filtered.map(product => (
                <tr key={product._id} className="border-b border-gold-100 last:border-0 hover:bg-gold-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded-lg object-contain bg-gray-100 border border-gold-200 flex-shrink-0" /> : <div className="w-10 h-10 bg-gold-100 rounded-lg flex items-center justify-center flex-shrink-0"><Package size={16} className="text-gold-500" /></div>}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-gold-600 truncate">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{product.category}</td>
                  <td className="py-3 px-4 font-semibold text-gold-600">₹{product.price?.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-500 line-through">₹{product.mrp?.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {product.variants?.length > 0 ? (() => {
                      const totalVariantStock = product.variants.reduce((s, v) => s + (v.colors?.reduce((cs, c) => cs + (c.stock || 0), 0) || 0), 0);
                      return (
                        <span className={`font-semibold ${totalVariantStock <= 5 ? 'text-red-600' : 'text-green-600'}`}>
                          {totalVariantStock}
                        </span>
                      );
                    })() : (
                      <span className={`font-semibold ${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{product.stock}</span>
                    )}</td>
                <td className="py-3 px-4">
                  {product.variants?.length > 0 ? (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full font-medium">{product.variants.length} variants</span>
                  ) : (
                    <span className="text-gray-400 text-xs">None</span>
                  )}
                </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1 flex-wrap">
                      {product.isFeatured && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">Featured</span>}
                      {product.isNewArrival && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">New</span>}
                      {product.isOnOffer && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">Offer</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="text-gold-600 hover:text-gold-700 p-1 hover:bg-gold-50 rounded-lg transition"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gold-200 bg-gradient-to-r from-gold-50 to-white sticky top-0 z-10">
              <h2 className="text-lg font-bold gold-text">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5">

              {/* Image Upload */}
              <ImageUploader images={form.images} onChange={images => setForm({ ...form, images })} />

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Autocomplete label="Product Name" value={form.name} onChange={v => setForm({ ...form, name: v })}
                  fetchUrl="/products/autocomplete?field=name" required />
                <Autocomplete label="Brand" value={form.brand} onChange={v => setForm({ ...form, brand: v })}
                  fetchUrl="/products/autocomplete?field=brand" required />
                <Autocomplete label="Category" value={form.category} onChange={v => setForm({ ...form, category: v })}
                  fetchUrl="/products/autocomplete?field=category" />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock *
                    {form.category === 'Mobiles' && form.variants?.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">(auto from IMEI)</span>
                    )}
                    {form.category !== 'Mobiles' && form.variants?.length > 0 && (
                      <span className="text-xs text-green-600 ml-2">(auto from variants)</span>
                    )}
                  </label>
                  <input type="number" value={form.stock}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })}
                    readOnly={form.variants?.length > 0}
                    className={`w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none ${form.variants?.length > 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-gold-50/50'}`} />
                  {form.variants?.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-1">Sum of all variant stocks: {form.stock}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                  <input type="number" value={form.mrp} onChange={e => setForm({ ...form, mrp: e.target.value })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3}
                  className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
              </div>

              {/* Dynamic Specifications */}
              <DynamicSpecs specs={form.specifications} onChange={specs => setForm({ ...form, specifications: specs })} />

              {/* Variants */}
              <div className="border-t border-gold-200 pt-4">
                <VariantManager
                  variants={form.variants || []}
                  onChange={variants => {
                    const autoStock = (variants || []).reduce((sum, v) =>
                      sum + (v.colors || []).reduce((cs, c) => cs + (c.stock || 0), 0), 0
                    );
                    setForm({ ...form, variants, stock: autoStock });
                  }}
                  basePrice={form.price}
                  baseMrp={form.mrp}
                  baseStock={form.stock}
                  category={form.category}
                />
              </div>

              {/* Checkboxes */}
              <div className="bg-gold-50/50 rounded-xl p-4 border border-gold-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Options</p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'emiAvailable', label: 'EMI Available' },
                    { key: 'exchangeAvailable', label: 'Exchange Available' },
                    { key: 'isFeatured', label: 'Featured' },
                    { key: 'isNewArrival', label: 'New Arrival' },
                    { key: 'isOnOffer', label: 'On Offer' },
                  ].map(opt => (
                    <label key={opt.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form[opt.key]} onChange={e => setForm({ ...form, [opt.key]: e.target.checked })} className="text-gold-600 rounded" />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gold-200 bg-gold-50/30 sticky bottom-0">
              <button onClick={() => setShowModal(false)} className="btn-outline-gold rounded-xl">Cancel</button>
              <button onClick={handleSave} className="btn-gold rounded-xl flex items-center gap-2">
                <Save size={16} /> {editingId ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImeiScanModal open={showImeiScan} onClose={() => setShowImeiScan(false)} />
    </div>
  );
}
