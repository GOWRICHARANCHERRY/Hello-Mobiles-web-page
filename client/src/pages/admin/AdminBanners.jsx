import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Edit2, Trash2, X, Save, Upload, Eye, EyeOff, ChevronUp, ChevronDown, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyBanner = {
  type: 'hero', image: '', product: '', highlightedText: '', bigText: '', smallText: '',
  buttonText: '', link: '', bgColor: '#1a1a2e', textColor: '#ffffff', order: 0, isActive: true,
};

export default function AdminBanners() {
  const { t } = useLanguage();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyBanner);
  const [editingId, setEditingId] = useState(null);
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [activeType, setActiveType] = useState('hero');
  const fileInputRef = useRef(null);

  useEffect(() => { loadBanners(); loadProducts(); }, []);

  const loadBanners = () => {
    api.get('/banners/admin').then(r => { setBanners(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const loadProducts = () => {
    api.get('/products').then(r => setProducts(r.data)).catch(() => {});
  };

  const uploadImage = async (file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error(t('admin.toastSelectImage')); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error(t('admin.toastImageTooLarge')); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('images', file);
      const { data } = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm(prev => ({ ...prev, image: data.urls[0] }));
      toast.success(t('admin.toastImageUploaded'));
    } catch (error) {
      toast.error(t('admin.toastUploadFailed'));
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
    if (form.type === 'hero' && !form.image) return toast.error(t('admin.toastHeroRequiresImage'));
    if (form.type === 'text' && !form.bigText && !form.highlightedText) return toast.error(t('admin.toastAddSomeText'));
    if (!form.bigText && !form.highlightedText) return toast.error(t('admin.toastAddSomeText'));

    try {
      const formData = new FormData();
      formData.append('type', form.type);
      formData.append('image', form.image);
      formData.append('product', form.product || '');
      formData.append('highlightedText', form.highlightedText);
      formData.append('bigText', form.bigText);
      formData.append('smallText', form.smallText);
      formData.append('buttonText', form.buttonText);
      formData.append('link', form.link);
      formData.append('bgColor', form.bgColor);
      formData.append('textColor', form.textColor);
      formData.append('order', form.order);
      formData.append('isActive', form.isActive);

      if (editingId) {
        await api.put(`/banners/${editingId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(t('admin.toastBannerUpdated'));
      } else {
        await api.post('/banners', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(t('admin.toastBannerCreated'));
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyBanner);
      loadBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.toastFailedSave'));
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
      buttonText: banner.buttonText || '',
      link: banner.link || '',
      bgColor: banner.bgColor || '#1a1a2e',
      textColor: banner.textColor || '#ffffff',
      order: banner.order || 0,
      isActive: banner.isActive,
    });
    setEditingId(banner._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('admin.confirmDeleteBanner'))) return;
    try {
      await api.delete(`/banners/${id}`);
      setBanners(prev => prev.filter(b => b._id !== id));
      toast.success(t('admin.toastBannerDeleted'));
    } catch (error) {
      toast.error(t('admin.toastFailedDelete'));
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/banners/${id}`, { isActive: !current });
      setBanners(prev => prev.map(b => b._id === id ? { ...b, isActive: !current } : b));
    } catch (error) {
      toast.error(t('admin.toastFailedUpdate'));
    }
  };

  const list = banners.filter(b => (b.type || 'hero') === activeType);
  const heroCount = banners.filter(b => (b.type || 'hero') === 'hero').length;
  const textCount = banners.filter(b => (b.type || 'hero') === 'text').length;

  const moveBanner = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const a = list[index], b = list[target];
    const reordered = banners.map(x => ({ ...x }));
    const ia = reordered.findIndex(x => x._id === a._id);
    const ib = reordered.findIndex(x => x._id === b._id);
    const orderA = reordered[ia].order, orderB = reordered[ib].order;
    reordered[ia].order = orderB;
    reordered[ib].order = orderA;
    setBanners(reordered);
    try {
      await api.put('/banners/reorder/batch', { order: reordered.map(x => ({ id: x._id, order: x.order })) });
      toast.success(t('admin.toastBannerOrderUpdated'));
    } catch (error) {
      toast.error(t('admin.toastFailedReorder'));
      loadBanners();
    }
  };

  const openAdd = () => {
    setForm({ ...emptyBanner, type: activeType });
    setEditingId(null);
    setShowModal(true);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t(activeType === 'hero' ? 'admin.banner1Image' : 'admin.banner2Text')} ({list.length})
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.manageBannersDesc')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition shadow-lg">
          <Plus size={16} /> {t('admin.addBannerType', { banner: t(activeType === 'hero' ? 'admin.banner1' : 'admin.banner2') })}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        <button onClick={() => setActiveType('hero')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl border-2 font-medium text-sm transition ${activeType === 'hero' ? 'border-gold-500 bg-gold-50 text-gold-700 shadow' : 'border-gray-200 text-gray-500 hover:border-gold-300'}`}>
          {t('admin.banner1Image')}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeType === 'hero' ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{heroCount}</span>
        </button>
        <button onClick={() => setActiveType('text')}
          className={`flex-1 sm:flex-none px-5 py-3 rounded-xl border-2 font-medium text-sm transition ${activeType === 'text' ? 'border-purple-500 bg-purple-50 text-purple-700 shadow' : 'border-gray-200 text-gray-500 hover:border-purple-300'}`}>
          {t('admin.banner2Text')}
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeType === 'text' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{textCount}</span>
        </button>
      </div>

      {/* Banner List */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center gold-border">
          <ImageIcon size={48} className="mx-auto text-gold-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">{t('admin.noBannersYet', { banner: t(activeType === 'hero' ? 'admin.banner1' : 'admin.banner2') })}</p>
          <p className="text-gray-400 text-sm mt-1">{t('admin.firstBannerHint')}</p>
          <button onClick={openAdd} className="btn-gold rounded-xl mt-4">{t('admin.addBanner')}</button>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((banner, index) => (
            <div key={banner._id} className="bg-white rounded-2xl shadow-sm overflow-hidden gold-border">
              <div className="flex flex-col md:flex-row">
                {/* Preview */}
                <div className="md:w-96 h-36 sm:h-44 md:h-auto relative flex-shrink-0"
                  style={{ backgroundColor: banner.bgColor }}>
                  {banner.image && (
                    <img src={banner.image} alt="" className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-6 text-center"
                    style={{ color: banner.textColor }}>
                    {banner.highlightedText && (
                      <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1 opacity-80">{banner.highlightedText}</p>
                    )}
                    {banner.bigText && (
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold leading-tight">{banner.bigText}</h2>
                    )}
                    {banner.smallText && (
                      <p className="text-xs sm:text-sm mt-1 sm:mt-2 opacity-75">{banner.smallText}</p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 p-4 md:p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-400">#{index + 1}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.type === 'text' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {banner.type === 'text' ? t('admin.banner2TextBadge') : t('admin.banner1ImageBadge')}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${banner.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {banner.isActive ? t('admin.active') : t('admin.inactive')}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {banner.highlightedText && <p><span className="text-gray-400">{t('admin.highlightLabel')}</span> <span className="font-medium text-gold-700">{banner.highlightedText}</span></p>}
                      {banner.bigText && <p><span className="text-gray-400">{t('admin.bigTextLabel')}</span> <span className="font-medium">{banner.bigText}</span></p>}
                      {banner.smallText && <p><span className="text-gray-400">{t('admin.smallTextLabel')}</span> {banner.smallText}</p>}
                      {banner.product && <p><span className="text-gray-400">{t('admin.linksToLabel')}</span> <span className="font-medium text-blue-600">{banner.product.name}</span></p>}
                      {!banner.product && <p className="text-gray-400 text-xs">{t('admin.noProductLinked')}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="flex flex-col mr-1">
                      <button onClick={() => moveBanner(index, -1)} disabled={index === 0}
                        title={t('admin.moveEarlier')}
                        className={`p-1 rounded transition ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <ChevronUp size={16} />
                      </button>
                      <button onClick={() => moveBanner(index, 1)} disabled={index === list.length - 1}
                        title={t('admin.moveLater')}
                        className={`p-1 rounded transition ${index === list.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}>
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <button onClick={() => toggleActive(banner._id, banner.isActive)}
                      className={`p-2 rounded-lg transition ${banner.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {banner.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => handleEdit(banner)} className="p-2 text-gold-700 hover:bg-gold-50 rounded-lg transition">
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
              <h2 className="text-lg font-bold gold-text">{editingId ? t('admin.editBanner') : t('admin.addNewBanner')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Banner Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.bannerType')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button type="button" onClick={() => setForm({ ...form, type: 'hero' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${form.type === 'hero' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <p className="text-sm font-bold text-gray-800">{t('admin.banner1Image')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.heroBannerDesc')}</p>
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'text' })}
                    className={`p-4 rounded-xl border-2 text-left transition ${form.type === 'text' ? 'border-gold-500 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                    <p className="text-sm font-bold text-gray-800">{t('admin.banner2TextOnly')}</p>
                    <p className="text-xs text-gray-500 mt-1">{t('admin.textBannerDesc')}</p>
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
                      {(form.product || form.link) && <span className="inline-block mt-3 px-4 py-1.5 rounded-lg text-xs font-semibold opacity-90" style={{ backgroundColor: form.textColor, color: form.bgColor }}>{form.buttonText || (form.product ? t('admin.viewProduct') : t('admin.shopNow'))} →</span>}
                    </div>
                  </div>
                )}
                {form.type === 'hero' && !form.image && (
                  <div className="h-56 flex items-center justify-center text-gray-400">
                    <p className="text-sm">{t('admin.uploadPreviewHint')}</p>
                  </div>
                )}
              </div>

              {/* Image Upload */}
              {form.type === 'hero' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin.bannerImageField')}</label>
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
                    <p className="text-sm text-gold-700 font-medium">{t('admin.uploading')}</p>
                  ) : (
                    <>
                      <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">{t('admin.uploadHint')}</p>
                      <p className="text-xs text-gray-400 mt-1">{t('admin.uploadRecommendation')}</p>
                    </>
                  )}
                </div>
                {form.image && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={form.image} alt="" className="w-20 h-12 rounded-lg object-cover border border-gold-200" />
                    <button onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                      className="text-red-500 text-xs hover:underline">{t('admin.remove')}</button>
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
                      {t('admin.matchingImages')} <span className="font-normal text-gray-400">{t('admin.fromLinkedProduct', { name: matchedProduct.name })}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {productImages.map((img, i) => (
                        <button key={i} type="button" onClick={() => setForm({ ...form, image: img })}
                          className={`rounded-lg overflow-hidden border-2 transition ${form.image === img ? 'border-gold-500 ring-2 ring-gold-300' : 'border-gray-200 hover:border-gold-400'}`}>
                          <img src={img} alt="" className="w-28 h-16 object-cover" />
                        </button>
                      ))}
                      {form.image && !productImages.includes(form.image) && (
                        <span className="inline-flex items-center text-xs text-gray-400">{t('admin.currentlyUsingCustom')}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{t('admin.clickImageHint')}</p>
                  </div>
                );
              })()}

              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.highlightedTextField')}</label>
                  <input value={form.highlightedText} onChange={e => setForm({ ...form, highlightedText: e.target.value })}
                    placeholder={t('admin.placeholderHighlighted')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.accentTextHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.bigTextField')}</label>
                  <input value={form.bigText} onChange={e => setForm({ ...form, bigText: e.target.value })}
                    placeholder={t('admin.placeholderBigText')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.bigTextHint')}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.smallTextField')}</label>
                  <input value={form.smallText} onChange={e => setForm({ ...form, smallText: e.target.value })}
                    placeholder={t('admin.placeholderSmallText')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.smallTextHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.buttonTextField')}</label>
                  <input value={form.buttonText} onChange={e => setForm({ ...form, buttonText: e.target.value })}
                    placeholder={t('admin.placeholderButtonText')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.buttonTextHint')}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.buttonLinkField')}</label>
                  <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                    placeholder={t('admin.placeholderButtonLink')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <p className="text-xs text-gray-400 mt-1">{t('admin.buttonLinkHint')}</p>
                </div>
              </div>

              {/* Product Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.linkToProduct')}</label>
                <select value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}
                  className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50">
                  <option value="">{t('admin.noProductNoRedirect')}</option>
                  {products.map(p => (
                    <option key={p._id} value={p._id}>{p.name} — ₹{p.price?.toLocaleString()}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">{t('admin.clickBannerHint')}</p>
              </div>

              {/* Colors and Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.backgroundColor')}</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gold-200" />
                    <input value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })}
                      className="flex-1 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.textColor')}</label>
                  <div className="flex gap-2 items-center">
                    <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2 border-gold-200" />
                    <input value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                      className="flex-1 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.displayOrder')}</label>
                  <input type="number" value={form.order} onChange={e => setForm({ ...form, order: Number(e.target.value) })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="text-gold-700 rounded" />
                {t('admin.activeVisible')}
              </label>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gold-200 bg-gold-50/30 sticky bottom-0">
              <button onClick={() => setShowModal(false)} className="btn-outline-gold rounded-xl">{t('admin.cancel')}</button>
              <button onClick={handleSave} className="btn-gold rounded-xl flex items-center gap-2">
                <Save size={16} /> {editingId ? t('admin.updateBanner') : t('admin.createBanner')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
