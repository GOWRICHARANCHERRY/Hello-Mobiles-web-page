import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#2563eb', '#f97316', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#ec4899'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Today's Revenue", value: `₹${(data?.dailyRevenue || 0).toLocaleString()}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
          { label: 'Monthly Revenue', value: `₹${(data?.monthlyRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'bg-blue-100 text-blue-600' },
          { label: 'Total Orders', value: data?.totalOrders || 0, icon: ShoppingCart, color: 'bg-purple-100 text-purple-600' },
          { label: 'Pending Orders', value: data?.pendingOrders || 0, icon: Package, color: 'bg-yellow-100 text-yellow-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`${stat.color} w-12 h-12 rounded-xl flex items-center justify-center`}><stat.icon size={22} /></div>
              <div>
                <p className="text-xs text-gray-500">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Products', value: data?.totalProducts || 0, color: 'text-primary-600' },
          { label: 'Total Customers', value: data?.totalCustomers || 0, color: 'text-accent-600' },
          { label: 'Employees', value: data?.totalEmployees || 0, color: 'text-purple-600' },
          { label: 'Low Stock Alerts', value: data?.lowStockProducts || 0, color: 'text-red-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Best Selling */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Best Selling Products</h2>
          {data?.bestSelling?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.bestSelling}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalSold" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>

        {/* Sales by Brand */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sales by Brand</h2>
          {data?.salesByBrand?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={data.salesByBrand} dataKey="revenue" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id }) => _id}>
                  {data.salesByBrand.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Monthly Revenue Trend</h2>
          {data?.monthlyTrend?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id.month" tick={{ fontSize: 11 }} tickFormatter={m => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m-1]} />
                <YAxis />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>

        {/* Sales by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Sales by Category</h2>
          {data?.salesByCategory?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.salesByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="_id" type="category" tick={{ fontSize: 11 }} width={100} />
                <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-400 text-sm text-center py-8">No data yet</p>}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 text-gray-600">Order</th>
                <th className="text-left py-2 text-gray-600">Customer</th>
                <th className="text-left py-2 text-gray-600">Amount</th>
                <th className="text-left py-2 text-gray-600">Status</th>
                <th className="text-left py-2 text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentOrders?.map(order => (
                <tr key={order._id} className="border-b last:border-0">
                  <td className="py-3 font-medium">#{order.orderNumber}</td>
                  <td className="py-3 text-gray-600">{order.customer?.name}</td>
                  <td className="py-3 font-medium">₹{order.total.toLocaleString()}</td>
                  <td className="py-3"><span className="capitalize text-xs bg-gray-100 px-2 py-1 rounded">{order.orderStatus}</span></td>
                  <td className="py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
              {(!data?.recentOrders || data.recentOrders.length === 0) && (
                <tr><td colSpan={5} className="py-8 text-center text-gray-400">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
