import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/reports/profit'),
    ]).then(([dashRes, reportRes]) => {
      setData({ ...dashRes.data, reports: reportRes.data });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Analytics & Reports</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">Total Orders (All Time)</p>
          <p className="text-3xl font-bold text-gold-600">{data?.reports?.summary?.count || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">Total Revenue (All Time)</p>
          <p className="text-3xl font-bold text-green-600">₹{(data?.reports?.summary?.total || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 text-center">
          <p className="text-sm text-gray-500">Average Order Value</p>
          <p className="text-3xl font-bold text-accent-600">
            ₹{data?.reports?.summary?.count > 0 ? Math.round((data.reports.summary.total || 0) / data.reports.summary.count).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales by Brand */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sales by Brand</h2>
          {data?.salesByBrand?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={data.salesByBrand} dataKey="revenue" nameKey="_id" cx="50%" cy="50%" outerRadius={100}
                  label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {data.salesByBrand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-12">No data available</p>}
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h2>
          {data?.salesByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.salesByCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {data.salesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-12">No data available</p>}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Revenue (This Year)</h2>
          {data?.monthlyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id.month" tick={{ fontSize: 11 }}
                  tickFormatter={m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Revenue" />
                <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-12">No data available</p>}
        </div>

        {/* Best Products */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Top Selling Products</h2>
          {data?.bestSelling?.length > 0 ? (
            <div className="space-y-3">
              {data.bestSelling.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-400 w-6">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item._id}</p>
                    <p className="text-xs text-gray-500">{item.totalSold} units sold</p>
                  </div>
                  <span className="font-bold text-sm text-green-600">₹{item.revenue?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm text-center py-12">No data available</p>}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 text-gray-600">Month</th>
                <th className="text-left py-2 text-gray-600">Orders</th>
                <th className="text-left py-2 text-gray-600">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data?.reports?.monthlyRevenue?.map((m, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 font-medium">{['January','February','March','April','May','June','July','August','September','October','November','December'][m._id.month - 1]} {m._id.year}</td>
                  <td className="py-2">{m.orders || '-'}</td>
                  <td className="py-2 font-medium">₹{(m.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
              {(!data?.reports?.monthlyRevenue || data.reports.monthlyRevenue.length === 0) && (
                <tr><td colSpan={3} className="py-8 text-center text-gray-400">No data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
