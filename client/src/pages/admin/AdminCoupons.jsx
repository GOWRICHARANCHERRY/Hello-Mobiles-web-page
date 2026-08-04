import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Plus, Edit2, Trash2, X, Save, Tag, Power, Percent, Search, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyCoupon = {
  code: '', discountType: 'percent', value: '', minOrder: 0, maxDiscount: '',
  validFrom: '', validTo: '', maxUses: 0, isActive: true,
  appliesTo: 'all', applicableProductIds: [],
};

export default function AdminCoupons() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { loadCoupons(); loadProducts(); }, []);

  const loadProducts = () => {
    setProductLoading(true);
    api.get('/products/names?withIds=1').then(r => {
      setProducts(r.data);
    }).finally(() => setProductLoading(false));
  };

  const toggleProduct = (id) => {
    setForm(prev => {
      const current = prev.applicableProductIds.map(String);
      const exists = current.includes(String(id));
      return {
        ...prev,
        applicableProductIds: exists
          ? current.filter(x => x !== String(id))
          : [...current, String(id)],
      };
    });
  };

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(q);
  });

  const loadCoupons = () => {
    api.get('/admin/coupons').then(r => { setCoupons(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!form.code.trim()) return toast.error(t('admin.toastCouponCodeRequired'));
    if (!form.value || Number(form.value) <= 0) return toast.error(t('admin.toastDiscountValueRequired'));
    if (form.appliesTo === 'selected' && form.applicableProductIds.length === 0) return toast.error(t('admin.toastSelectProduct'));
    setSaving(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        value: Number(form.value),
        minOrder: Number(form.minOrder) || 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        validFrom: form.validFrom || undefined,
        validTo: form.validTo || undefined,
        maxUses: Number(form.maxUses) || 0,
        isActive: form.isActive,
        appliesTo: form.appliesTo,
        applicableProductIds: form.appliesTo === 'selected' ? form.applicableProductIds : [],
      };
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, payload);
        toast.success(t('admin.toastCouponUpdated'));
      } else {
        await api.post('/admin/coupons', payload);
        toast.success(t('admin.toastCouponCreated'));
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyCoupon);
      loadCoupons();
    } catch (error) {
      toast.error(error.response?.data?.message || t('admin.toastFailedSaveCoupon'));
    }
    setSaving(false);
  };

  const handleEdit = (coupon) => {
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      value: coupon.value,
      minOrder: coupon.minOrder || 0,
      maxDiscount: coupon.maxDiscount ?? '',
      validFrom: coupon.validFrom ? coupon.validFrom.slice(0, 10) : '',
      validTo: coupon.validTo ? coupon.validTo.slice(0, 10) : '',
      maxUses: coupon.maxUses || 0,
      isActive: coupon.isActive,
      appliesTo: coupon.appliesTo || 'all',
      applicableProductIds: (coupon.applicableProductIds || []).map(id => String(id)),
    });
    setEditingId(coupon._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('admin.confirmDeleteCoupon'))) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      setCoupons(prev => prev.filter(c => c._id !== id));
      toast.success(t('admin.toastCouponDeleted'));
    } catch (error) {
      toast.error(t('admin.toastFailedDelete'));
    }
  };

  const toggleActive = async (id, current) => {
    try {
      await api.put(`/admin/coupons/${id}`, { isActive: !current });
      setCoupons(prev => prev.map(c => c._id === id ? { ...c, isActive: !current } : c));
      toast.success(current ? t('admin.toastCouponDeactivated') : t('admin.toastCouponActivated'));
    } catch (error) {
      toast.error(t('admin.toastFailedUpdate'));
    }
  };

  const openAdd = () => {
    setForm(emptyCoupon);
    setEditingId(null);
    setShowModal(true);
  };

  const isExpired = (c) => c.validTo && new Date(c.validTo) < new Date();

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.coupons')} ({coupons.length})</h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.couponsDesc')}</p>
        </div>
        <button onClick={openAdd}
          className="bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:from-gold-600 hover:to-gold-700 transition shadow-lg">
          <Plus size={16} /> {t('admin.addCoupon')}
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center gold-border">
          <Tag size={48} className="mx-auto text-gold-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">{t('admin.noCouponsYet')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('admin.firstCouponHint')}</p>
          <button onClick={openAdd} className="btn-gold rounded-xl mt-4">{t('admin.addCoupon')}</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map(coupon => {
            const expired = isExpired(coupon);
            const active = coupon.isActive && !expired;
            return (
              <div key={coupon._id} className="bg-white rounded-2xl shadow-sm gold-border p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="font-mono font-bold text-lg gold-text tracking-wider">{coupon.code}</span>
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {expired ? t('admin.expired') : coupon.isActive ? t('admin.active') : t('admin.disabled')}
                      </span>
                    </div>
                    <button onClick={() => toggleActive(coupon._id, coupon.isActive)}
                      className={`p-2 rounded-lg transition ${active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      <Power size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center gap-1 text-2xl font-bold text-gray-800">
                      {coupon.discountType === 'percent' ? <Percent size={20} className="text-gold-500" /> : null}
                      {coupon.discountType === 'percent' ? t('admin.percentOff', { value: coupon.value }) : t('admin.fixedOff', { value: coupon.value.toLocaleString() })}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <p>{t('admin.minOrderLabel')} <span className="font-medium text-gray-700">₹{coupon.minOrder.toLocaleString()}</span></p>
                    <p className="flex items-center gap-1"><Package size={12} className="text-gold-500" /> {t('admin.appliesToLabel')} <span className="font-medium text-gray-700">{coupon.appliesTo === 'selected' ? ((coupon.applicableProductIds || []).length === 1 ? t('admin.selectedProductsOne', { count: (coupon.applicableProductIds || []).length }) : t('admin.selectedProductsMany', { count: (coupon.applicableProductIds || []).length })) : t('admin.allProducts')}</span></p>
                    {coupon.maxDiscount ? <p>{t('admin.maxDiscountLabel')} <span className="font-medium text-gray-700">₹{coupon.maxDiscount.toLocaleString()}</span></p> : <p>{t('admin.maxDiscountLabel')} <span className="font-medium text-gray-700">{t('admin.noLimit')}</span></p>}
                    <p>{t('admin.usesLabel')} <span className="font-medium text-gray-700">{coupon.usedCount || 0}{coupon.maxUses > 0 ? ` / ${coupon.maxUses}` : ' / ∞'}</span></p>
                    <p>{t('admin.validLabel')} <span className="font-medium text-gray-700">{coupon.validFrom ? new Date(coupon.validFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : t('admin.anyTime')} — {coupon.validTo ? new Date(coupon.validTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : t('admin.noExpiry')}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={() => handleEdit(coupon)} className="flex-1 p-2 text-gold-600 hover:bg-gold-50 rounded-lg transition text-sm font-medium">{t('admin.edit')}</button>
                  <button onClick={() => handleDelete(coupon._id)} className="flex-1 p-2 text-red-500 hover:bg-red-50 rounded-lg transition text-sm font-medium">{t('admin.delete')}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gold-200 bg-gradient-to-r from-gold-50 to-white sticky top-0 z-10">
              <h2 className="text-lg font-bold gold-text">{editingId ? t('admin.editCoupon') : t('admin.addNewCoupon')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.couponCodeField')}</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder={t('admin.placeholderCouponCode')}
                  className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm uppercase font-mono focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.discountType')}</label>
                <div className="flex gap-2">
                  {['percent', 'fixed'].map(dt => (
                    <button key={dt} onClick={() => setForm({ ...form, discountType: dt })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${form.discountType === dt ? 'border-gold-500 bg-gold-100 text-gold-700' : 'border-gray-200 text-gray-500 hover:border-gold-300'}`}>
                      {dt === 'percent' ? t('admin.percentPercentage') : t('admin.fixedAmount')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.appliesTo')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, appliesTo: 'all' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${form.appliesTo === 'all' ? 'border-gold-500 bg-gold-100 text-gold-700' : 'border-gray-200 text-gray-500 hover:border-gold-300'}`}>
                    {t('admin.allProducts')}
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, appliesTo: 'selected' })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition ${form.appliesTo === 'selected' ? 'border-gold-500 bg-gold-100 text-gold-700' : 'border-gray-200 text-gray-500 hover:border-gold-300'}`}>
                    {t('admin.selectedProducts')}
                  </button>
                </div>
              </div>

              {form.appliesTo === 'selected' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-medium text-gray-700">{t('admin.selectProductsLabel')} <span className="text-gold-600 font-bold">{t('admin.selectedCount', { count: form.applicableProductIds.length })}</span></label>
                  </div>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder={t('admin.placeholderSearchProducts')}
                      className="w-full border-2 border-gold-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  </div>
                  <div className="border-2 border-gold-200 rounded-xl overflow-hidden bg-white">
                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                      {productLoading ? (
                        <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gold-500"></div></div>
                      ) : filteredProducts.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-8">{t('admin.noProductsFound')}</p>
                      ) : (
                        filteredProducts.map(p => {
                          const checked = form.applicableProductIds.includes(String(p._id));
                          return (
                            <label key={p._id} className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer hover:bg-gold-50/50 transition ${checked ? 'bg-gold-50/70' : ''}`}>
                              <input type="checkbox" checked={checked} onChange={() => toggleProduct(p._id)}
                                className="mt-0.5 text-gold-600 rounded focus:ring-gold-400" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-800 truncate">{p.name}</span>
                                <span className="block text-[11px] text-gray-400">{p.brand} · {p.category}</span>
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{form.discountType === 'percent' ? t('admin.discountPercentField') : t('admin.discountAmountField')}</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder={form.discountType === 'percent' ? t('admin.placeholderDiscountPercent') : t('admin.placeholderDiscountAmount')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.minOrderField')}</label>
                  <input type="number" value={form.minOrder} onChange={e => setForm({ ...form, minOrder: e.target.value })}
                    placeholder={t('admin.placeholderMinOrder')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.maxDiscountField')}</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder={t('admin.optional')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.maxUsesField')}</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder={t('admin.placeholderMaxUses')}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.validFrom')}</label>
                  <input type="date" value={form.validFrom} onChange={e => setForm({ ...form, validFrom: e.target.value })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.validTo')}</label>
                  <input type="date" value={form.validTo} onChange={e => setForm({ ...form, validTo: e.target.value })}
                    className="w-full border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="text-gold-600 rounded" />
                {t('admin.activeRedeemable')}
              </label>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gold-200 bg-gold-50/30 sticky bottom-0">
              <button onClick={() => setShowModal(false)} className="btn-outline-gold rounded-xl">{t('admin.cancel')}</button>
              <button onClick={handleSave} disabled={saving} className="btn-gold rounded-xl flex items-center gap-2">
                <Save size={16} /> {editingId ? t('admin.updateCoupon') : t('admin.createCoupon')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
