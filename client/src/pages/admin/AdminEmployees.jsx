import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../utils/api';
import { Plus, Trash2, UserCheck, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';

const emptyForm = { name: '', phone: '', email: '', password: '' };

export default function AdminEmployees() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { api.get('/admin/employees').then(r => { setEmployees(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const openAdd = () => { setForm(emptyForm); setEditingId(null); setShowForm(true); };

  const openEdit = (emp) => {
    setForm({ name: emp.name || '', phone: emp.phone || '', email: emp.email || '', password: '' });
    setEditingId(emp._id);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { data } = await api.put(`/admin/employees/${editingId}`, form);
        setEmployees(prev => prev.map(emp => emp._id === editingId ? { ...emp, ...data } : emp));
        toast.success(t('admin2.employeeUpdated'));
      } else {
        const { data } = await api.post('/admin/employees', form);
        setEmployees(prev => [...prev, data]);
        toast.success(t('admin2.employeeAdded'));
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
    } catch (error) { toast.error(error.response?.data?.message || t('admin2.failed')); }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('admin2.confirmRemoveEmployee'))) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
      toast.success(t('admin2.employeeRemoved'));
    } catch (error) { toast.error(t('admin2.failed')); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin2.employees')} ({employees.length})</h1>
        <button onClick={openAdd}
          className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gold-700">
          <Plus size={16} /> {t('admin2.addEmployee')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold mb-4">{editingId ? t('admin2.editEmployee') : t('admin2.addNewEmployee')}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder={t('admin2.fullName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input placeholder={t('admin2.phoneNumber')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input placeholder={t('admin2.email')} value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input type="password" placeholder={editingId ? t('admin2.newPasswordKeep') : t('admin2.password')} value={form.password} onChange={e => setForm({...form, password: e.target.value})} required={!editingId}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-700">{editingId ? t('admin2.updateEmployee') : t('admin2.addEmployee')}</button>
              <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">{t('admin2.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-gray-600">{t('admin2.employee')}</th>
              <th className="text-left py-3 px-4 text-gray-600">{t('admin2.phone')}</th>
              <th className="text-left py-3 px-4 text-gray-600">{t('admin2.email')}</th>
              <th className="text-left py-3 px-4 text-gray-600">{t('admin2.joined')}</th>
              <th className="text-left py-3 px-4 text-gray-600">{t('admin2.action')}</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => (
              <tr key={emp._id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gold-100 rounded-full flex items-center justify-center"><UserCheck size={14} className="text-gold-600" /></div>
                    <span className="font-medium">{emp.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{emp.phone}</td>
                <td className="py-3 px-4 text-gray-600">{emp.email || '-'}</td>
                <td className="py-3 px-4 text-gray-500 text-xs">{new Date(emp.createdAt).toLocaleDateString('en-IN')}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEdit(emp)} className="text-gold-600 hover:text-gold-700" title={t('admin2.editEmployeeTitle')}><Pencil size={16} /></button>
                    <button onClick={() => handleDelete(emp._id)} className="text-red-500 hover:text-red-600" title={t('admin2.removeEmployeeTitle')}><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">{t('admin2.noEmployees')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
