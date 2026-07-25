import { useState, useEffect, Fragment } from 'react';
import api from '../../utils/api';
import { Package, Edit2, Save, AlertTriangle, Search, Filter, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [newStock, setNewStock] = useState(0);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [expandedProducts, setExpandedProducts] = useState({});

  useEffect(() => {
    api.get('/employee/inventory').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const variantTotalStock = (variant) => (variant.colors || []).reduce((s, c) => s + (c.stock || 0), 0);
  const productTotalStock = (product) => product.variants?.reduce((s, v) => s + variantTotalStock(v), 0) || 0;

  const handleUpdateStock = async (productId, variantId = null, colorId = null) => {
    try {
      if (variantId && colorId) {
        const product = products.find(p => p._id === productId);
        const variants = product.variants.map(v => {
          if (v._id !== variantId) return v;
          return { ...v, colors: v.colors.map(c => c._id === colorId ? { ...c, stock: newStock } : c) };
        });
        await api.put(`/employee/inventory/${productId}`, { variants });
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, variants } : p));
      } else if (variantId) {
        const product = products.find(p => p._id === productId);
        const variants = product.variants.map(v => {
          if (v._id !== variantId) return v;
          return { ...v, colors: v.colors.map(c => ({ ...c, stock: newStock })) };
        });
        await api.put(`/employee/inventory/${productId}`, { variants });
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, variants } : p));
      } else {
        await api.put(`/employee/inventory/${productId}`, { stock: newStock });
        setProducts(prev => prev.map(p => p._id === productId ? { ...p, stock: newStock } : p));
      }
      setEditingId(null);
      toast.success('Stock updated!');
    } catch (error) {
      toast.error('Failed to update stock');
    }
  };

  const toggleExpand = (productId) => {
    setExpandedProducts(prev => ({ ...prev, [productId]: !prev[productId] }));
  };

  if (loading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;

  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterBrand && p.brand !== filterBrand) return false;
    const hasVariants = p.variants?.length > 0;
    const totalStock = hasVariants ? productTotalStock(p) : p.stock;
    if (filterStock === 'low' && (hasVariants ? totalStock > 5 : p.stock > p.lowStockThreshold)) return false;
    if (filterStock === 'out' && totalStock > 0) return false;
    if (filterStock === 'in' && totalStock <= 0) return false;
    return true;
  });

  const hasFilters = search || filterCategory || filterBrand || filterStock;

  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management ({filtered.length}{hasFilters ? ` of ${products.length}` : ''})</h1>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 gold-border">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gold-600" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterBrand(''); setFilterStock(''); }}
              className="text-xs text-red-500 hover:text-red-600 ml-2 underline">Clear All</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or brand..."
              className="w-full pl-9 pr-3 py-2 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Brands</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">All Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="in">In Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium w-8"></th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Product</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Brand</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Category</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Price</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Stock</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No products match your filters</td></tr>
              ) : filtered.map(product => {
                const hasVariants = product.variants?.length > 0;
                const isExpanded = expandedProducts[product._id];
                const totalStock = hasVariants ? productTotalStock(product) : product.stock;
                return (
                  <Fragment key={product._id}>
                    <tr className={`border-b ${!hasVariants && product.stock <= product.lowStockThreshold ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-4">
                        {hasVariants ? (
                          <button onClick={() => toggleExpand(product._id)} className="text-gray-400 hover:text-gold-600">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-contain bg-gray-100" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center"><Package size={16} className="text-gray-400" /></div>}
                          <div>
                            <span className="font-medium">{product.name}</span>
                            {hasVariants && <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{product.variants.length} variants</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{product.brand}</td>
                      <td className="py-3 px-4 text-gray-500">{product.category}</td>
                      <td className="py-3 px-4 font-medium">₹{product.price.toLocaleString()}{hasVariants && <span className="text-xs text-gray-400 block">from</span>}</td>
                      <td className="py-3 px-4">
                        {!hasVariants ? (
                          editingId === `base-${product._id}` ? (
                            <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))}
                              className="w-20 border rounded px-2 py-1 text-sm" autoFocus />
                          ) : (
                            <span className={`font-medium ${product.stock <= product.lowStockThreshold ? 'text-red-600' : 'text-green-600'}`}>
                              {product.stock}
                              {product.stock <= product.lowStockThreshold && <AlertTriangle size={14} className="inline ml-1 text-yellow-500" />}
                            </span>
                          )
                        ) : (
                          <span className="text-xs text-gray-500">Total: {totalStock}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!hasVariants ? (
                          editingId === `base-${product._id}` ? (
                            <button onClick={() => handleUpdateStock(product._id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                          ) : (
                            <button onClick={() => { setEditingId(`base-${product._id}`); setNewStock(product.stock); }} className="text-gold-600 hover:text-gold-700"><Edit2 size={16} /></button>
                          )
                        ) : (
                          <button onClick={() => toggleExpand(product._id)} className="text-gold-600 hover:text-gold-700 text-xs font-medium">
                            {isExpanded ? 'Hide' : 'Manage'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {hasVariants && isExpanded && product.variants.map((variant, vi) => (
                      <Fragment key={`${product._id}-${variant._id || vi}`}>
                        <tr className="border-b bg-blue-50/30">
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4 pl-12" colSpan={2}>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="font-semibold text-blue-700">{variant.ram || 'N/A'}</span>
                              <span>/</span>
                              <span className="font-semibold text-blue-700">{variant.storage || 'N/A'}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-sm font-medium">₹{variant.price?.toLocaleString()}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-xs text-gray-500">Total stock: {variantTotalStock(variant)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4">
                            {editingId === `variant-${product._id}-${variant._id}` ? (
                              <div className="flex items-center gap-1">
                                <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))}
                                  className="w-16 border rounded px-1 py-0.5 text-xs" autoFocus placeholder="Set all" />
                                <button onClick={() => handleUpdateStock(product._id, variant._id)} className="text-green-600 hover:text-green-700"><Save size={12} /></button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-xs">cancel</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingId(`variant-${product._id}-${variant._id}`); setNewStock(0); }}
                                className="text-xs text-blue-600 hover:text-blue-700 underline">Set all colors</button>
                            )}
                          </td>
                          <td className="py-2 px-4"></td>
                        </tr>
                        {(variant.colors || []).map((color, ci) => (
                          <tr key={`${product._id}-${variant._id}-${color._id || ci}`} className="border-b bg-blue-50/50">
                            <td className="py-1.5 px-4"></td>
                            <td className="py-1.5 px-4 pl-16">
                              <span className="text-xs text-gray-600">{color.name || 'Unnamed'}</span>
                            </td>
                            <td className="py-1.5 px-4 text-gray-400 text-xs">-</td>
                            <td className="py-1.5 px-4 text-gray-400 text-xs">-</td>
                            <td className="py-1.5 px-4 text-xs">-</td>
                            <td className="py-1.5 px-4">
                              {editingId === `color-${product._id}-${variant._id}-${color._id}` ? (
                                <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))}
                                  className="w-16 border rounded px-1 py-0.5 text-xs" autoFocus />
                              ) : (
                                <span className={`font-medium text-xs ${color.stock <= 0 ? 'text-red-600' : color.stock <= (product.lowStockThreshold || 5) ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {color.stock}
                                  {color.stock <= (product.lowStockThreshold || 5) && <AlertTriangle size={10} className="inline ml-1 text-yellow-500" />}
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-4">
                              {editingId === `color-${product._id}-${variant._id}-${color._id}` ? (
                                <button onClick={() => handleUpdateStock(product._id, variant._id, color._id)} className="text-green-600 hover:text-green-700"><Save size={12} /></button>
                              ) : (
                                <button onClick={() => { setEditingId(`color-${product._id}-${variant._id}-${color._id}`); setNewStock(color.stock); }} className="text-gold-600 hover:text-gold-700"><Edit2 size={12} /></button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
