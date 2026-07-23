import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, Phone, Mail, MapPin } from 'lucide-react';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { api.get('/admin/customers').then(r => { setCustomers(r.data); setLoading(false); }).catch(() => setLoading(false)); }, []);

  const filtered = customers.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Customers ({customers.length})</h1>

      <div className="mb-4">
        <input type="text" placeholder="Search by name, phone, or email..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full md:w-96 border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600">Customer</th>
                <th className="text-left py-3 px-4 text-gray-600">Phone</th>
                <th className="text-left py-3 px-4 text-gray-600">Email</th>
                <th className="text-left py-3 px-4 text-gray-600">Address</th>
                <th className="text-left py-3 px-4 text-gray-600">Points</th>
                <th className="text-left py-3 px-4 text-gray-600">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(customer => (
                <tr key={customer._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-accent-100 rounded-full flex items-center justify-center"><Users size={14} className="text-accent-600" /></div>
                      <span className="font-medium">{customer.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{customer.phone}</td>
                  <td className="py-3 px-4 text-gray-600">{customer.email || '-'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {customer.address?.street ? `${customer.address.street}, ${customer.address.city}` : '-'}
                  </td>
                  <td className="py-3 px-4 font-medium text-accent-600">{customer.loyaltyPoints || 0}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{new Date(customer.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No customers found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
