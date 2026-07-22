import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Package, Edit2, Save, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState(0);

  useEffect(() => {
    api.get('/employee/inventory').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleUpdateStock = async (productId) => {
    try {
      await api.put(`/employee/inventory/${productId}`, { stock: newStock });
      setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p));
      setEditingId(null);
      toast.success('Stock updated!');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Brand</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} className={`border-b last:border-0 ${product.stock <= product.lowStockThreshold ? 'bg-yellow-50' : ''}`}>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-contain bg-gray-100" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
                      <span className="font-medium">{product.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{product.brand}</td>
                  <td className="py-3 px-4 text-gray-500">{product.category}</td>
                  <td className="py-3 px-4 font-medium">₹{product.price.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    {editingId === product._id ? (
                      <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))}
                        className="w-20 border rounded px-2 py-1 text-sm" autoFocus />
                    ) : (
                      <span className={`font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                        {product.stock}
                        {product.stock <= product.lowStockThreshold && <AlertTriangle size={14} className="inline ml-1 text-yellow-500" />}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {editingId === product._id ? (
                      <button onClick={() => handleUpdateStock(product._id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                    ) : (
                      <button onClick={() => { setEditingId(product._id); setNewStock(product.stock); }} className="text-primary-600 hover:text-primary-700"><Edit2 size={16} /></button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
