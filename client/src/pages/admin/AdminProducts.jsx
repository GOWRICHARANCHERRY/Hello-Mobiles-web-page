import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Plus, Edit2, Trash2, X, Save, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const categories = ['Mobiles', 'TVs', 'Smart Watches', 'Earbuds', 'Laptops', 'Home Appliances', 'Accessories'];

const emptyProduct = {
  name: '', brand: '', category: 'Mobiles', price: '', mrp: '', description: '',
  specifications: { ram: '', storage: '', screenSize: '', color: '', battery: '', processor: '', camera: '', os: '', warranty: '' },
  stock: 0, emiAvailable: true, exchangeAvailable: true, isFeatured: false, isNewArrival: false, isOnOffer: false, images: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = () => {
    api.get('/products').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, form);
        toast.success('Product updated!');
      } else {
        await api.post('/products', form);
        toast.success('Product created!');
      }
      setShowModal(false);
      setEditingId(null);
      setForm(emptyProduct);
      loadProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setForm({ ...emptyProduct, ...product, specifications: { ...emptyProduct.specifications, ...product.specifications } });
    setEditingId(product._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
      toast.success('Product deleted!');
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const handleImageAdd = () => {
    const url = prompt('Enter image URL:');
    if (url) setForm(prev => ({ ...prev, images: [...prev.images, url] }));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div></div>;

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products ({products.length})</h1>
        <button onClick={() => { setForm(emptyProduct); setEditingId(null); setShowModal(true); }}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-primary-700 transition">
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600">Product</th>
                <th className="text-left py-3 px-4 text-gray-600">Category</th>
                <th className="text-left py-3 px-4 text-gray-600">Price</th>
                <th className="text-left py-3 px-4 text-gray-600">MRP</th>
                <th className="text-left py-3 px-4 text-gray-600">Stock</th>
                <th className="text-left py-3 px-4 text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product._id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-contain bg-gray-100" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">{product.category}</td>
                  <td className="py-3 px-4 font-medium">₹{product.price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-500">₹{product.mrp.toLocaleString()}</td>
                  <td className="py-3 px-4"><span className={`font-medium ${product.stock <= 5 ? 'text-red-600' : 'text-green-600'}`}>{product.stock}</span></td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1">
                      {product.isFeatured && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded">Featured</span>}
                      {product.isNewArrival && <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">New</span>}
                      {product.isOnOffer && <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded">Offer</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(product)} className="text-primary-600 hover:text-primary-700"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(product._id)} className="text-red-500 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-bold">{editingId ? 'Edit Product' : 'Add Product'}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                  <input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock *</label>
                  <input type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
                  <input type="number" value={form.mrp} onChange={e => setForm({...form, mrp: Number(e.target.value)})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specifications</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.keys(form.specifications).map(key => (
                    <div key={key}>
                      <label className="block text-xs text-gray-500 mb-1 capitalize">{key}</label>
                      <input value={form.specifications[key]} onChange={e => setForm({...form, specifications: {...form.specifications, [key]: e.target.value}})}
                        className="w-full border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={img} alt="" className="w-16 h-16 rounded object-contain bg-gray-100" />
                      <button onClick={() => setForm(prev => ({...prev, images: prev.images.filter((_, j) => j !== i)}))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">×</button>
                    </div>
                  ))}
                </div>
                <button onClick={handleImageAdd} className="text-primary-600 text-sm hover:underline">+ Add Image URL</button>
              </div>

              <div className="flex flex-wrap gap-4">
                {[
                  { key: 'emiAvailable', label: 'EMI Available' },
                  { key: 'exchangeAvailable', label: 'Exchange Available' },
                  { key: 'isFeatured', label: 'Featured' },
                  { key: 'isNewArrival', label: 'New Arrival' },
                  { key: 'isOnOffer', label: 'On Offer' },
                ].map(opt => (
                  <label key={opt.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form[opt.key]} onChange={e => setForm({...form, [opt.key]: e.target.checked})} className="text-primary-600" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowModal(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} className="bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 flex items-center gap-2">
                <Save size={16} /> {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
