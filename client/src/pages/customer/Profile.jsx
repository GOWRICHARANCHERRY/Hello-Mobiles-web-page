import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { User, MapPin, Ticket, HelpCircle, Globe, Edit2, Save, Package, ChevronRight, Phone, Mail, MessageCircle, Clock, Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const tabs = [
  { id: 'personal', label: 'cust.personalDetails', icon: User },
  { id: 'orders', label: 'cust.myOrders', icon: Package },
  { id: 'address', label: 'cust.savedAddress', icon: MapPin },
  { id: 'coupons', label: 'cust.myCoupons', icon: Ticket },
  { id: 'help', label: 'cust.helpSupport', icon: HelpCircle },
  { id: 'language', label: 'cust.preferredLanguage', icon: Globe },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'personal');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '',
    street: user?.address?.street || '', city: user?.address?.city || '',
    state: user?.address?.state || '', pincode: user?.address?.pincode || '',
  });
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addrForm, setAddrForm] = useState({ label: 'Home', street: '', city: '', state: '', pincode: '', phone: '' });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.find(t => t.id === tab)) setActiveTab(tab);
  }, [searchParams]);

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
    loadAddresses();
  }, []);

  const loadAddresses = () => {
    const saved = JSON.parse(localStorage.getItem('hm_addresses') || '[]');
    if (saved.length === 0) {
      saved.push({
        id: 'default',
        label: 'Home',
        street: user?.address?.street || '45 MG Road',
        city: user?.address?.city || 'Hyderabad',
        state: user?.address?.state || 'Telangana',
        pincode: user?.address?.pincode || '500001',
        phone: user?.phone || '',
        isDefault: true,
      });
      localStorage.setItem('hm_addresses', JSON.stringify(saved));
    }
    setAddresses(saved);
  };

  const saveAddresses = (list) => {
    localStorage.setItem('hm_addresses', JSON.stringify(list));
    setAddresses(list);
  };

  const handleAddAddress = () => {
    if (!addrForm.street || !addrForm.city || !addrForm.pincode) {
      toast.error(t('cust.fillRequiredFields'));
      return;
    }
    let updated;
    if (editingAddress) {
      updated = addresses.map(a => a.id === editingAddress.id ? { ...a, ...addrForm } : a);
      toast.success(t('cust.addressUpdated'));
    } else {
      const newAddr = { ...addrForm, id: Date.now().toString(), isDefault: addresses.length === 0 };
      updated = [...addresses, newAddr];
      toast.success(t('cust.addressAdded'));
    }
    saveAddresses(updated);
    setShowAddressModal(false);
    setEditingAddress(null);
    setAddrForm({ label: 'Home', street: '', city: '', state: '', pincode: '', phone: '' });
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter(a => a.id !== id);
    if (addresses.find(a => a.id === id)?.isDefault && updated.length > 0) {
      updated[0].isDefault = true;
    }
    saveAddresses(updated);
    toast.success(t('cust.addressDeleted'));
  };

  const handleSetDefault = (id) => {
    const updated = addresses.map(a => ({ ...a, isDefault: a.id === id }));
    saveAddresses(updated);
  };

  const openEditAddress = (addr) => {
    setEditingAddress(addr);
    setAddrForm({ label: addr.label, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode, phone: addr.phone || '' });
    setShowAddressModal(true);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleSave = async () => {
    try {
      const { data } = await api.put('/profile', {
        name: form.name, email: form.email,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode },
      });
      updateUser(data);
      setEditing(false);
      toast.success(t('cust.profileUpdated'));
    } catch (error) {
      toast.error(t('cust.failedToUpdateProfile'));
    }
  };

  const handleLanguageChange = async (lang) => {
    setLanguage(lang);
    try {
      await api.put('/profile', { language: lang });
      updateUser({ language: lang });
    } catch (error) {
      console.error('Failed to save language preference');
    }
  };

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* User Card */}
          <div className="bg-white rounded-xl shadow-sm p-5 mb-4 text-center">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-3 text-white text-xl font-bold">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <h2 className="font-bold text-gray-800">{user?.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{user?.phone}</p>
            {user?.email && <p className="text-xs text-gray-500">{user.email}</p>}
            <div className="mt-3 p-2 bg-yellow-50 rounded-lg">
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t('cust.loyaltyPoints')}</p>
              <p className="text-xl font-bold text-yellow-600">{user?.loyaltyPoints || 0}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl shadow-sm p-2">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'gold-gradient text-white shadow-md'
                    : 'text-gray-600 hover:bg-gold-50'
                }`}>
                <tab.icon size={16} />
                <span className="text-left">{t(tab.label)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          {activeTab === 'personal' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800">{t('cust.personalDetails')}</h3>
                <button onClick={() => editing ? handleSave() : setEditing(true)}
                  className="gold-gradient text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:opacity-90 transition shadow-md">
                  {editing ? <><Save size={14} /> {t('cust.save')}</> : <><Edit2 size={14} /> {t('cust.edit')}</>}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.name')}</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!editing}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none border-gold-300' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.email')}</label>
                  <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} disabled={!editing}
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm ${editing ? 'focus:ring-2 focus:ring-gold-500 outline-none border-gold-300' : 'bg-gray-50 border-gray-200'}`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.phoneNumber')}</label>
                  <input value={user?.phone || ''} disabled
                    className="w-full border rounded-lg px-4 py-2.5 text-sm bg-gray-50 border-gray-200 text-gray-500" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800">{t('cust.myOrders')} ({orders.length})</h3>
                <Link to="/orders" className="text-gold-600 text-sm font-semibold hover:underline flex items-center gap-1">
                  {t('cust.viewAll')} <ChevronRight size={14} />
                </Link>
              </div>
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('cust.noOrdersYet')}</p>
                  <Link to="/products" className="btn-gold rounded-xl mt-4 inline-block text-sm">{t('cust.startShopping')}</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map(order => {
                    const statusColor = order.orderStatus === 'delivered' ? 'bg-green-100 text-green-700'
                      : order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-600'
                      : order.orderStatus === 'shipped' ? 'bg-blue-100 text-blue-700'
                      : 'bg-gold-100 text-gold-700';
                    return (
                      <Link key={order._id} to={`/orders/${order._id}`}
                        className="flex items-center justify-between gap-3 p-4 border border-gray-100 rounded-xl hover:border-gold-300 hover:bg-gold-50/30 hover:shadow-sm transition group cursor-pointer">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-14 h-14 rounded-xl bg-gold-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {order.items?.[0]?.product?.images?.[0] ? (
                              <img src={order.items[0].product.images[0]} alt="" loading="lazy" width="60" height="60" className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <Package size={22} className="text-gold-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-sm text-gray-800">#{order.orderNumber}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize ${statusColor}`}>{order.orderStatus}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{order.items?.length || 0} item{(order.items?.length || 0) > 1 ? 's' : ''} · {order.paymentMethod?.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-3 flex-shrink-0">
                          <div>
                            <p className="font-bold text-sm text-gray-900">₹{order.total.toLocaleString()}</p>
                            <p className="text-[11px] text-gold-600 font-medium group-hover:underline">{t('cust.viewDetails')}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-400 group-hover:text-gold-500 transition" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'address' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-lg text-gray-800">{t('cust.savedAddress')}</h3>
                <button onClick={() => { setEditingAddress(null); setAddrForm({ label: 'Home', street: '', city: '', state: '', pincode: '', phone: '' }); setShowAddressModal(true); }}
                  className="gold-gradient text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 hover:opacity-90 transition shadow-md">
                  <Plus size={14} /> {t('cust.addAddress')}
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">{t('cust.noSavedAddresses')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map(addr => (
                    <div key={addr.id} className={`border rounded-xl p-5 transition ${addr.isDefault ? 'border-gold-300 bg-gold-50/50' : 'border-gray-200 hover:border-gold-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'bg-gold-100' : 'bg-gray-100'}`}>
                            <MapPin size={18} className={addr.isDefault ? 'text-gold-600' : 'text-gray-500'} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-gray-800">{addr.label}</p>
                              {addr.isDefault && <span className="text-[10px] bg-gold-500 text-white px-2 py-0.5 rounded-full font-semibold">{t('cust.default')}</span>}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{addr.street}</p>
                            <p className="text-sm text-gray-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                            {addr.phone && <p className="text-xs text-gray-500 mt-1">📞 {addr.phone}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefault(addr.id)} className="text-xs text-gold-600 hover:underline font-medium">{t('cust.setDefault')}</button>
                          )}
                          <button onClick={() => openEditAddress(addr)} aria-label="Edit address" className="p-1.5 hover:bg-gold-100 rounded-lg transition">
                            <Edit2 size={14} className="text-gold-600" />
                          </button>
                          {!addr.isDefault && (
                            <button onClick={() => handleDeleteAddress(addr.id)} aria-label="Delete address" className="p-1.5 hover:bg-red-100 rounded-lg transition">
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-5">{t('cust.myCoupons')}</h3>
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-4">
                  <Ticket size={32} className="text-orange-400" />
                </div>
                <p className="text-gray-600 font-medium">{t('cust.noCouponsAvailable')}</p>
                <p className="text-sm text-gray-400 mt-1">{t('cust.stayTuned')}</p>
              </div>
            </div>
          )}

          {activeTab === 'help' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-5">{t('cust.helpSupport')}</h3>
              <div className="space-y-4">
                <a href="https://wa.me/918886888128" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-green-300 hover:bg-green-50 transition">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircle size={22} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{t('cust.whatsappSupport')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('cust.chatOnWhatsapp')}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </a>
                <a href="tel:+918886888128"
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Phone size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{t('cust.callUs')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">+91 88868 88128</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </a>
                <a href="mailto:svlnmobiles12@gmail.com"
                  className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-gold-300 hover:bg-gold-50 transition">
                  <div className="w-12 h-12 rounded-xl bg-gold-100 flex items-center justify-center flex-shrink-0">
                    <Mail size={22} className="text-gold-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-800">{t('cust.emailUs')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">svlnmobiles12@gmail.com</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </a>
                <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Clock size={22} className="text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{t('cust.storeHours')}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t('cust.storeHoursTime')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-bold text-lg text-gray-800 mb-5">{t('cust.preferredLanguage')}</h3>
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${language === 'en' ? 'border-gold-300 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input type="radio" name="language" checked={language === 'en'} onChange={() => handleLanguageChange('en')} className="w-4 h-4 text-gold-600 accent-gold-600" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">English</p>
                      <p className="text-xs text-gray-500">{t('cust.defaultLanguage')}</p>
                    </div>
                  </div>
                </label>
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${language === 'hi' ? 'border-gold-300 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input type="radio" name="language" checked={language === 'hi'} onChange={() => handleLanguageChange('hi')} className="w-4 h-4 text-gold-600 accent-gold-600" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">हिन्दी</p>
                      <p className="text-xs text-gray-500">Hindi</p>
                    </div>
                  </div>
                </label>
                <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition ${language === 'te' ? 'border-gold-300 bg-gold-50' : 'border-gray-200 hover:border-gold-300'}`}>
                  <input type="radio" name="language" checked={language === 'te'} onChange={() => handleLanguageChange('te')} className="w-4 h-4 text-gold-600 accent-gold-600" />
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🇮🇳</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">తెలుగు</p>
                      <p className="text-xs text-gray-500">Telugu</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-down">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-800">{editingAddress ? t('cust.editAddress') : t('cust.addNewAddress')}</h3>
              <button onClick={() => { setShowAddressModal(false); setEditingAddress(null); }} aria-label="Close dialog" className="p-1 hover:bg-gray-100 rounded-lg transition">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.label')}</label>
                <select value={addrForm.label} onChange={e => setAddrForm({...addrForm, label: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none">
                  <option>{t('cust.home')}</option>
                  <option>{t('cust.work')}</option>
                  <option>{t('cust.other')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.streetAddress')} *</label>
                <input value={addrForm.street} onChange={e => setAddrForm({...addrForm, street: e.target.value})} placeholder={t('cust.streetPlaceholder')}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.city')} *</label>
                  <input value={addrForm.city} onChange={e => setAddrForm({...addrForm, city: e.target.value})} placeholder={t('cust.city')}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.state')} *</label>
                  <input value={addrForm.state} onChange={e => setAddrForm({...addrForm, state: e.target.value})} placeholder={t('cust.state')}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.pincode')} *</label>
                  <input value={addrForm.pincode} onChange={e => setAddrForm({...addrForm, pincode: e.target.value})} placeholder={t('cust.pincode')} maxLength={6}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('cust.phone')}</label>
                  <input value={addrForm.phone} onChange={e => setAddrForm({...addrForm, phone: e.target.value})} placeholder={t('cust.phoneNumber')} maxLength={10}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-5 border-t border-gray-100">
              <button onClick={() => { setShowAddressModal(false); setEditingAddress(null); }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition">
                {t('cust.cancel')}
              </button>
              <button onClick={handleAddAddress}
                className="flex-1 gold-gradient text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition shadow-md">
                {editingAddress ? t('cust.updateAddress') : t('cust.saveAddress')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
