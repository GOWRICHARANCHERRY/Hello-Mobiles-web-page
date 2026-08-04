import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Phone, User, MessageSquare, Check, MailOpen, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminLeads() {
  const { t } = useLanguage();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadLeads(); }, []);

  const loadLeads = () => {
    setLoading(true);
    api.get('/admin/leads').then(r => { setLeads(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const markRead = async (id) => {
    try {
      await api.put(`/admin/leads/${id}`);
      setLeads(prev => prev.map(l => l._id === id ? { ...l, read: true } : l));
      toast.success(t('admin.toastMarkedAsRead'));
    } catch (error) {
      toast.error(t('admin.toastFailedUpdate'));
    }
  };

  const unreadCount = leads.filter(l => !l.read).length;

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.enquiriesLeadsTitle')} ({leads.length})</h1>
          <p className="text-sm text-gray-500 mt-1">{t('admin.unreadSummary', { count: unreadCount })}</p>
        </div>
        <button onClick={loadLeads} className="btn-outline-gold rounded-xl flex items-center gap-2 text-sm">
          <RefreshCw size={16} /> {t('admin.refresh')}
        </button>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center gold-border">
          <Mail size={48} className="mx-auto text-gold-300 mb-4" />
          <p className="text-gray-500 text-lg font-medium">{t('admin.noLeadsYet')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('admin.leadsEmptyHint')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map(lead => (
            <div key={lead._id} className={`bg-white rounded-2xl shadow-sm gold-border p-4 flex flex-col md:flex-row md:items-center gap-4 transition ${lead.read ? 'opacity-70' : 'ring-2 ring-gold-300'}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  {!lead.read && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-700 uppercase">{t('admin.newBadge')}</span>}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">{lead.source}</span>
                  <span className="text-xs text-gray-400">{new Date(lead.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="font-semibold text-gray-800 flex items-center gap-2 truncate">
                  {lead.name ? <><User size={14} className="text-gold-500 flex-shrink-0" />{lead.name}</> : t('admin.anonymousVisitor')}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-gray-600">
                  {lead.email && <span className="flex items-center gap-1.5"><Mail size={13} className="text-gray-400" />{lead.email}</span>}
                  {lead.phone && <span className="flex items-center gap-1.5"><Phone size={13} className="text-gray-400" />{lead.phone}</span>}
                </div>
                {lead.message && (
                  <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 flex items-start gap-2">
                    <MessageSquare size={14} className="text-gold-500 flex-shrink-0 mt-0.5" />{lead.message}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 md:flex-col md:items-end flex-shrink-0">
                {lead.read ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium"><Check size={14} /> {t('admin.readBadge')}</span>
                ) : (
                  <button onClick={() => markRead(lead._id)} className="flex items-center gap-1.5 text-xs text-gold-600 hover:text-gold-700 font-medium px-3 py-1.5 bg-gold-50 border border-gold-200 rounded-lg transition">
                    <MailOpen size={14} /> {t('admin.markAsRead')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
