import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Trash2, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' });

  useEffect(() => { api.get('/admin/employees').then(r => { setEmployees(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/admin/employees', form);
      setEmployees(prev => [...prev, data]);
      setForm({ name: '', phone: '', email: '', password: '' });
      setShowForm(false);
      toast.success('Employee added!');
    } catch (error) { toast.error(error.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this employee?')) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      setEmployees(prev => prev.filter(e => e._id !== id));
      toast.success('Employee removed!');
    } catch (error) { toast.error('Failed'); }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Employees ({employees.length})</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-gold-700">
          <Plus size={16} /> Add Employee
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="font-bold mb-4">Add New Employee</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input placeholder="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required
              className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
            <div className="md:col-span-2 flex gap-2">
              <button type="submit" className="bg-gold-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gold-700">Add Employee</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-gray-600">Employee</th>
              <th className="text-left py-3 px-4 text-gray-600">Phone</th>
              <th className="text-left py-3 px-4 text-gray-600">Email</th>
              <th className="text-left py-3 px-4 text-gray-600">Joined</th>
              <th className="text-left py-3 px-4 text-gray-600">Action</th>
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
                  <button onClick={() => handleDelete(emp._id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No employees yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
