import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { DollarSign, ShoppingCart, AlertTriangle, Package } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function EmployeeDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/employee/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('emp.dashboardTitle')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 w-12 h-12 rounded-xl flex items-center justify-center"><DollarSign size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">{t('emp.todaySales')}</p>
              <p className="text-xl font-bold text-gray-900">₹{(data?.todaySales || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center"><ShoppingCart size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">{t('emp.todayOrders')}</p>
              <p className="text-xl font-bold text-gray-900">{data?.todayOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-100 text-yellow-600 w-12 h-12 rounded-xl flex items-center justify-center"><AlertTriangle size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">{t('emp.pendingOrders')}</p>
              <p className="text-xl font-bold text-gray-900">{data?.pendingOrders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 w-12 h-12 rounded-xl flex items-center justify-center"><Package size={22} /></div>
            <div>
              <p className="text-xs text-gray-500">{t('emp.lowStockItems')}</p>
              <p className="text-xl font-bold text-gray-900">{data?.lowStockProducts?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {data?.lowStockProducts?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-yellow-500" /> {t('emp.lowStockAlerts')}
            <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">{data.lowStockProducts.length}</span>
          </h2>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {data.lowStockProducts.map(product => (
              <div key={product._id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{product.brand}</p>
                  </div>
                  <span className={`flex-shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {product.stock === 0 ? t('emp.outOfStock') : `${product.stock} ${t('emp.left')}`}
                  </span>
                </div>
                <div className="mt-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-gray-400">{t('emp.stockLeftShort')}</span>
                    <span className="text-[10px] font-semibold text-gray-500">{product.stock}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full rounded-full ${product.stock === 0 ? 'bg-red-500' : product.stock <= 2 ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${Math.min((product.stock / 5) * 100, 100)}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 text-gray-600 whitespace-nowrap">{t('emp.product')}</th>
                  <th className="text-left py-2 pr-3 text-gray-600 whitespace-nowrap">{t('emp.brand')}</th>
                  <th className="text-left py-2 text-gray-600 whitespace-nowrap">{t('emp.stock')}</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map(product => (
                  <tr key={product._id} className="border-b last:border-0">
                    <td className="py-3 pr-3 font-medium text-gray-800 truncate max-w-[300px]">{product.name}</td>
                    <td className="py-3 pr-3 text-gray-500 whitespace-nowrap">{product.brand}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-2 overflow-hidden flex-shrink-0">
                          <div className={`h-full rounded-full ${product.stock === 0 ? 'bg-red-500' : product.stock <= 2 ? 'bg-red-400' : 'bg-amber-400'}`}
                            style={{ width: `${Math.min((product.stock / 5) * 100, 100)}%` }}></div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {product.stock === 0 ? t('emp.outOfStock') : t('emp.stockLeft', { count: product.stock })}
                        </span>
                      </div>
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
