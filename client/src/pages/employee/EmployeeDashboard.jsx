import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { DollarSign, ShoppingCart, AlertTriangle, Package } from 'lucide-react';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/employee/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Employee Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center"><DollarSign size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">Today's Sales</p>
              <p className="text-xl font-bold text-gray-900">₹{(data?.todaySales || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center"><ShoppingCart size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">Today's Orders</p>
              <p className="text-xl font-bold text-gray-900">{data?.todayOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center"><AlertTriangle size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">Pending Orders</p>
              <p className="text-xl font-bold text-gray-900">{data?.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-xl flex items-center justify-center"><Package size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">Low Stock Items</p>
              <p className="text-xl font-bold text-gray-900">{data?.lowStockProducts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" /> Low Stock Alerts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 text-gray-600">Product</th>
                  <th className="text-left py-2 text-gray-600">Brand</th>
                  <th className="text-left py-2 text-gray-600">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map(product => (
                  <tr key={product._id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3 text-gray-500">{product.brand}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {product.stock === 0 ? 'Out of Stock' : `${product.stock} left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
