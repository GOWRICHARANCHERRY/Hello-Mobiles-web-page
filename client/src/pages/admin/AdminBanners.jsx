import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, Save, Upload, Eye, EyeOff, GripVertical, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyBanner = {
  type: 'hero', image: '', product: '', highlightedText: '', bigText: '', smallText: '',
  bgColor: '#1a1a2e', textColor: '#ffffff', order: 0, isActive: true,
};

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyBanner);
  const [editingId, setEditingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { loadBanners(); loadProducts(); }, []);

  const loadBanners = () => {
    api.get('/banners/admin').then(r => { setBanners(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadProducts = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  };

  const uploadImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Please select an image'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, image: data.urls[0] }));
      toast.success('Image uploaded!');
    } catch (error) {
      toast.error('Upload failed');
    }
    setUploading(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    uploadImage(file);
  };

  const handleSave = async () => {
    if (form.type === 'hero' && !form.image) return toast.error('Banner 1 requires an image');
    if (form.type === 'text' && !form.bigText && !form.highlightedText) return toast.error('Please add at least some text');
    if (!form.bigText && !form.highlightedText) return toast.error('Please add at least some text');

    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('image', form.image);
      formData.append('product', form.product || '');
      formData.append('highlightedText', form.highlightedText);
      formData.append('bigText', form.bigText);
      formData.append('smallText', form.smallText);
      formData.append('bgColor', form.bgColor);
      formData.append('textColor', form.textColor);
      formData.append('order', form.order);
      formData.append('isActive', form.isActive);

      if (editingId) {
        await api.put(`/banners/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Banner updated!');
      } else {
        await api.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Banner created!');
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyBanner);
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save');
    }
  };

  const handleEdit = (banner) => {
    setForm({
      type: banner.type || 'hero',
      image: banner.image || '',
      product: banner.product?._id || '',
      highlightedText: banner.highlightedText || '',
      bigText: banner.bigText || '',
      smallText: banner.smallText || '',
      bgColor: banner.bgColor || '#1a1a2e',
      textColor: banner.textColor || '#ffffff',
      order: banner.order || 0,
      isActive: banner.isActive,
    });
    setEditingId(banner._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(prev => prev.filter(b => b._id !== id));
      toast.success('Banner deleted!');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/banners/${id}`, { isActive: !current });
      setBanners(prev => prev.map(b => b._id === id ? { ...b, isActive: !current } : b));
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const openAdd = () => {
    setForm(emptyBanner);
    setEditingId(null);
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Home Banners ({banners.length})</h1>
          <p className="text-sm text-gray-500 mt-1">Manage the hero carousel banners on the home page</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition shadow-lg">
          <Plus size={16} /> Add Banner
        </button>
      </div>

      {/* Banner List */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center gold-border">
          <ImageIcon size={48} className="mx-auto text-gold-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">No banners yet</p>
          <p className="text-gray-400 text-sm mt-1">Add your first banner to show on the home page</p>
          <button onClick={openAdd} className="btn-gold rounded-xl mt-4">Add Banner</button>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div key={banner._id} className="bg-white rounded-2xl shadow-sm overflow-hidden gold-border">
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="md:w-96 h-48 md:h-auto relative flex-shrink-0"
                  style={{ backgroundColor: banner.bgColor }}>
                  {banner.image && (
                    <img src={banner.image} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
                    style={{ color: banner.textColor }}>
                    {banner.highlightedText && (
                      <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{banner.highlightedText}</p>
                    )}
                    {banner.bigText && (
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight">{banner.bigText}</h2>
                    )}
                    {banner.smallText && (
                      <p className="text-sm mt-2 opacity-75">{banner.smallText}</p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.type === 'text' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {banner.type === 'text' ? 'Banner 2 · Text' : 'Banner 1 · Image'}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {banner.highlightedText && <p><span className="text-gray-400">Highlight:</span> <span className="font-medium text-gold-600">{banner.highlightedText}</span></p>}
                      {banner.bigText && <p><span className="text-gray-400">Big Text:</span> <span className="font-medium">{banner.bigText}</span></p>}
                      {banner.smallText && <p><span className="text-gray-400">Small Text:</span> {banner.smallText}</p>}
                      {banner.product && <p><span className="text-gray-400">Links to:</span> <span className="font-medium text-blue-600">{banner.product.name}</span></p>}
                      {!banner.product && <p className="text-gray-400 text-xs">No product linked</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <button onClick={() => toggleActive(banner._id, banner.isActive)}
                      className={`p-2 rounded-lg transition ${banner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => handleEdit(banner)} className="p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(banner._id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gold-200 bg-gradient-to-r from-gold-50 to-white sticky top-0 z-10">
              <h2 className="text-lg font-bold gold-text">{editingId ? 'Edit Banner' : 'Add New Banner'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, type: 'hero' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${form.type === 'hero' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <p className="text-sm font-bold text-gray-800">Banner 1 — Image</p>
                    <p className="text-xs text-gray-500 mt-1">Background image + text overlay (carousel hero banner)</p>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'text' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${form.type === 'text' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <p className="text-sm font-bold text-gray-800">Banner 2 — Text Only</p>
                    <p className="text-xs text-gray-500 mt-1">Color background + editable text + product link, no image</p>
                  </button>
                </div>
              </div>

              {/* Live Preview */}
              <div className="rounded-2xl overflow-hidden border-2 border-gold-200" style={{ backgroundColor: form.bgColor }}>
                {form.type === 'hero' && form.image && (
                  <div className="relative h-56 flex items-center">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center" style={{ color: form.textColor }}>
                      {form.highlightedText && <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{form.highlightedText}</p>}
                      {form.bigText && <h2 className="text-3xl font-bold leading-tight">{form.bigText}</h2>}
                      {form.smallText && <p className="text-sm mt-2 opacity-75">{form.smallText}</p>}
                    </div>
                    <div className="w-2/5 h-full flex items-center justify-center p-4">
                      <img src={form.image} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
                    </div>
                  </div>
                )}
                {form.type === 'text' && (
                  <div className="relative h-56 flex flex-col items-center justify-center p-6 text-center" style={{ color: form.textColor }}>
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1.5px, transparent 1.5px)', backgroundSize: '24px 24px' }}></div>
                    <div className="relative">
                      {form.highlightedText && <p className="text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{form.highlightedText}</p>}
                      {form.bigText && <h2 className="text-3xl font-bold leading-tight">{form.bigText}</h2>}
                      {form.smallText && <p className="text-sm mt-2 opacity-75">{form.smallText}</p>}
                      {form.product && <span className="inline-block mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold opacity-90" style={{ backgroundColor: form.textColor, color: form.bgColor }}>View Product →</span>}
                    </div>
                  </div>
                )}
                {form.type === 'hero' && !form.image && (
                  <div className="h-56 flex items-center justify-center text-gray-400">
                    <p className="text-sm">Upload an image to see preview</p>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              {form.type === 'hero' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Banner Image *</label>
                <div
                  onDrop={handleDrop}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-gold-500 bg-gold-50' : 'border-gray-300 hover:border-gold-400 hover:bg-gold-50/50'}`}
                >
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => uploadImage(e.target.files[0])} />
                  {uploading ? (
                    <p className="text-sm text-gold-600 font-medium">Uploading...</p>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Drag & drop or click to upload banner image</p>
                      <p className="text-xs text-gray-400 mt-1">Recommended: 1200x500px, JPG/PNG/WebP, max 10MB</p>
                    </>
                  )}
                </div>
                {form.image && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={form.image} alt="" className="w-20 h-12 rounded-lg object-cover border border-gold-200" />
                    <button onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      className="text-red-500 text-xs hover:underline">Remove</button>
                  </div>
                )}
              </div>
              )}

              {/* Matching images from linked product */}
              {form.type === 'hero' && form.product && (() => {
                const matchedProduct = products.find(p => p._id === form.product);
                const productImages = matchedProduct?.images?.filter(img => img) || [];
                if (productImages.length === 0) return null;
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Matching Images <span className="font-normal text-gray-400">(from linked product: {matchedProduct.name})</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {productImages.map((img, i) => (
                        <button key={i} type="button" onClick={() => setForm({ ...form, image: img })}
                          className={`rounded-lg overflow-hidden border-2 transition ${form.image === img ? 'border-gold-500 ring-2 ring-gold-300' : 'border-gray-200 hover:border-gold-400'}`}>
                          <img src={img} alt="" className="w-28 h-16 object-cover" />
                        </button>
                      ))}
                      {form.image && !productImages.includes(form.image) && (
                        <span className="inline-flex items-center text-xs text-gray-400">Currently using uploaded/custom image</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Click an image to use it as the banner image — it matches the product in your text</p>
                  </div>
                );
              })()}

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Highlighted Text</label>
                  <input value={form.highlightedText} onChange={e => setForm({ ...form, highlightedText: e.target.value })}
                    placeholder="e.g. NEW ARRIVAL, LIMITED OFFER"
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">Small accent text above the main heading</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Big Text (Heading)</label>
                  <input value={form.bigText} onChange={e => setForm({ ...form, bigText: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max"
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">Main heading text on the banner</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Small Text (Subheading)</label>
                  <input value={form.smallText} onChange={e => setForm({ ...form, smallText: e.target.value })}
                    placeholder="e.g. Starting at ₹1,29,999 | Trade-in available"
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">Subheading or call-to-action text</p>
                </div>
              </div>

              {/* Product Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link to Product (optional)</label>
                <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                  className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50">
                  <option value="">No product (no redirect)</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} — ₹{p.price?.toLocaleString()}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Clicking the banner will redirect to this product page</p>
              </div>

              {/* Colors and Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gold-200" />
                    <input value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })}
                      className="flex-1 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gold-200" />
                    <input value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                      className="flex-1 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                  <input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="text-gold-600 rounded" />
                Active (visible on home page)
              </label>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gold-200 bg-gold-50/30 sticky bottom-0">
              <button onClick={() => setShowModal(false)} className="btn-outline-gold rounded-xl">Cancel</button>
              <button onClick={handleSave} className="btn-gold rounded-xl flex items-center gap-2">
                <Save size={16} /> {editingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
