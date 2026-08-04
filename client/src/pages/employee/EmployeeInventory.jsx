import { useState, useEffect, Fragment } from 'react';
import api from '../../utils/api';
import { Package, Edit2, Save, AlertTriangle, Search, Filter, ChevronDown, ChevronRight, Camera, Upload, X, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import ImeiScanModal from '../../components/ImeiScanModal';
import { useLanguage } from '../../context/LanguageContext';

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
  const [showImeiScan, setShowImeiScan] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const { t } = useLanguage();

  useEffect(() => {
    api.get('/employee/inventory').then(r => { setProducts(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleBulkFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const lines = e.target.result.split(/\r?\n/).filter(l => l.trim());
        if (lines.length === 0) return toast.error(t('emp.emptyFile'));
        let start = 0;
        const first = lines[0].split(',').map(c => c.trim().toLowerCase());
        if (first.includes('name') || first.includes('product')) start = 1;
        const rows = [];
        for (let i = start; i < lines.length; i++) {
          const cols = lines[i].split(',');
          const name = (cols[0] || '').trim();
          const stock = (cols[1] || '').trim();
          if (!name) continue;
          rows.push({ name, stock });
        }
        if (rows.length === 0) return toast.error(t('emp.noValidRows'));
        setBulkRows(rows);
        setBulkResults(null);
      } catch (err) {
        toast.error(t('emp.failedParseFile'));
      }
    };
    reader.readAsText(file);
  };

  const submitBulk = async () => {
    setBulkLoading(true);
    try {
      const { data } = await api.post('/admin/bulk-stock', { items: bulkRows });
      setBulkResults(data);
      toast.success(t('emp.updatedProducts', { count: data.updated }));
      api.get('/employee/inventory').then(r => setProducts(r.data)).catch(() => {});
    } catch (error) {
      toast.error(error.response?.data?.message || t('emp.bulkUpdateFailed'));
    }
    setBulkLoading(false);
  };

  const downloadTemplate = () => {
    const csv = 'name,stock\nSamsung Galaxy S24,10\niPhone 15,5\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

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
      toast.success(t('emp.stockUpdated'));
    } catch (error) {
      toast.error(t('emp.failedUpdateStock'));
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('emp.inventoryManagement')} ({filtered.length}{hasFilters ? ` ${t('emp.ofTotal', { total: products.length })}` : ''})</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowBulkModal(true)}
            className="bg-gold-600 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-gold-700 transition shadow-lg">
            <Upload size={16} /> {t('emp.bulkStock')}
          </button>
          <button onClick={() => setShowImeiScan(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-blue-600 transition shadow-lg">
            <Camera size={16} /> {t('emp.scanImei')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4 gold-border">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gold-700" />
          <span className="text-sm font-semibold text-gray-700">{t('emp.filters')}</span>
          {hasFilters && (
            <button onClick={() => { setSearch(''); setFilterCategory(''); setFilterBrand(''); setFilterStock(''); }}
              className="text-xs text-red-500 hover:text-red-600 ml-2 underline">{t('emp.clearAll')}</button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t('emp.searchNameBrand')}
              className="w-full pl-9 pr-3 py-2 border-2 border-gold-200 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50" />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">{t('emp.allCategories')}</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">{t('emp.allBrands')}</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select value={filterStock} onChange={e => setFilterStock(e.target.value)}
            className="border-2 border-gold-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 focus:border-gold-400 outline-none bg-gold-50/50">
            <option value="">{t('emp.allStock')}</option>
            <option value="low">{t('emp.lowStock')}</option>
            <option value="out">{t('emp.outOfStock')}</option>
            <option value="in">{t('emp.inStock')}</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-gray-600 font-medium w-8"></th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.product')}</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.brand')}</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.category')}</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.price')}</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.stock')}</th>
                <th className="text-left py-3 px-4 text-gray-600 font-medium">{t('emp.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">{t('emp.noProductsMatch')}</td></tr>
              ) : filtered.map(product => {
                const hasVariants = product.variants?.length > 0;
                const isExpanded = expandedProducts[product._id];
                const totalStock = hasVariants ? productTotalStock(product) : product.stock;
                return (
                  <Fragment key={product._id}>
                    <tr className={`border-b ${!hasVariants && product.stock <= product.lowStockThreshold ? 'bg-yellow-50' : ''}`}>
                      <td className="py-3 px-4">
                        {hasVariants ? (
                          <button onClick={() => toggleExpand(product._id)} className="text-gray-400 hover:text-gold-700">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-10 h-10 rounded object-contain bg-gray-100 flex-shrink-0" /> : <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center flex-shrink-0"><Package size={16} className="text-gray-400" /></div>}
                          <div className="min-w-0">
                            <span className="font-medium block truncate">{product.name}</span>
                            {hasVariants && <span className="mt-1 inline-block text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{t('emp.variantsCount', { count: product.variants.length })}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{product.brand}</td>
                      <td className="py-3 px-4 text-gray-500">{product.category}</td>
                      <td className="py-3 px-4 font-medium">₹{product.price.toLocaleString()}{hasVariants && <span className="text-xs text-gray-400 block">{t('emp.from')}</span>}</td>
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
                          <span className="text-xs text-gray-500">{t('emp.totalStock', { count: totalStock })}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!hasVariants ? (
                          editingId === `base-${product._id}` ? (
                            <button onClick={() => handleUpdateStock(product._id)} className="text-green-600 hover:text-green-700"><Save size={16} /></button>
                          ) : (
                            <button onClick={() => { setEditingId(`base-${product._id}`); setNewStock(product.stock); }} className="text-gold-700 hover:text-gold-700"><Edit2 size={16} /></button>
                          )
                        ) : (
                          <button onClick={() => toggleExpand(product._id)} className="text-gold-700 hover:text-gold-700 text-xs font-medium">
                            {isExpanded ? t('emp.hide') : t('emp.manage')}
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
                              <span className="font-semibold text-blue-700">{variant.ram || t('emp.na')}</span>
                              <span>/</span>
                              <span className="font-semibold text-blue-700">{variant.storage || t('emp.na')}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-sm font-medium">₹{variant.price?.toLocaleString()}</span>
                              <span className="text-gray-400">|</span>
                              <span className="text-xs text-gray-500">{t('emp.totalStockVariant', { count: variantTotalStock(variant) })}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4"></td>
                          <td className="py-2 px-4">
                            {editingId === `variant-${product._id}-${variant._id}` ? (
                              <div className="flex items-center gap-1">
                                <input type="number" value={newStock} onChange={e => setNewStock(Number(e.target.value))}
                                  className="w-16 border rounded px-1 py-0.5 text-xs" autoFocus placeholder={t('emp.setAll')} />
                                <button onClick={() => handleUpdateStock(product._id, variant._id)} className="text-green-600 hover:text-green-700"><Save size={12} /></button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 text-xs">{t('emp.cancel')}</button>
                              </div>
                            ) : (
                              <button onClick={() => { setEditingId(`variant-${product._id}-${variant._id}`); setNewStock(0); }}
                                className="text-xs text-blue-600 hover:text-blue-700 underline">{t('emp.setAllColors')}</button>
                            )}
                          </td>
                          <td className="py-2 px-4"></td>
                        </tr>
                        {(variant.colors || []).map((color, ci) => (
                          <tr key={`${product._id}-${variant._id}-${color._id || ci}`} className="border-b bg-blue-50/50">
                            <td className="py-1.5 px-4"></td>
                            <td className="py-1.5 px-4 pl-16">
                              <span className="text-xs text-gray-600">{color.name || t('emp.unnamed')}</span>
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
                                <button onClick={() => { setEditingId(`color-${product._id}-${variant._id}-${color._id}`); setNewStock(color.stock); }} className="text-gold-700 hover:text-gold-700"><Edit2 size={12} /></button>
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

      {/* Bulk Stock Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gold-200 bg-gradient-to-r from-gold-50 to-white sticky top-0 z-10">
              <h2 className="text-lg font-bold gold-text">{t('emp.bulkStockUpdate')}</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkRows([]); setBulkResults(null); }} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">{t('emp.uploadCsvPart1')} <span className="font-semibold font-mono">name,stock</span> {t('emp.uploadCsvPart2')}</p>
                <button onClick={downloadTemplate} className="flex items-center gap-1 text-xs text-gold-700 hover:text-gold-700 font-semibold flex-shrink-0">
                  <Download size={14} /> {t('emp.template')}
                </button>
              </div>

              {!bulkResults && (
                <label className="block cursor-pointer">
                  <input type="file" accept=".csv,text/csv" className="hidden"
                    onChange={e => { handleBulkFile(e.target.files[0]); e.target.value = ''; }} />
                  <div className="border-2 border-dashed border-gold-300 rounded-xl p-8 text-center hover:border-gold-500 hover:bg-gold-50/50 transition">
                    <Upload size={32} className="mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">{t('emp.clickSelectCsv')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('emp.fuzzyMatching')}</p>
                  </div>
                </label>
              )}

              {bulkRows.length > 0 && !bulkResults && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">{t('emp.rowsParsed', { count: bulkRows.length })}</p>
                    <button onClick={() => setBulkRows([])} className="text-xs text-red-500 hover:underline">{t('emp.clear')}</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left py-2 px-3 text-gray-600 font-medium">{t('emp.productName')}</th>
                          <th className="text-left py-2 px-3 text-gray-600 font-medium w-20">{t('emp.stock')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkRows.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="py-2 px-3 text-gray-700">{row.name}</td>
                            <td className="py-2 px-3 font-semibold text-gold-700">{row.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {bulkResults && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                    <Package size={18} className="text-green-600" />
                    <p className="text-sm font-semibold text-green-700">{t('emp.updatedSuccessfully', { count: bulkResults.updated })}</p>
                  </div>
                  {bulkResults.notFound?.length > 0 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <p className="text-sm font-semibold text-yellow-700 mb-1">{t('emp.notFound', { count: bulkResults.notFound.length })}</p>
                      <ul className="text-xs text-yellow-700 space-y-0.5 max-h-32 overflow-y-auto">
                        {bulkResults.notFound.map((n, i) => <li key={i}>• {n}</li>)}
                      </ul>
                    </div>
                  )}
                  {bulkResults.errors?.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-sm font-semibold text-red-700 mb-1">{t('emp.errors', { count: bulkResults.errors.length })}</p>
                      <ul className="text-xs text-red-700 space-y-0.5 max-h-32 overflow-y-auto">
                        {bulkResults.errors.map((e, i) => <li key={i}>{t('emp.errorItem', { name: e.name, message: e.message })}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gold-200 bg-gold-50/30 sticky bottom-0">
              <button onClick={() => { setShowBulkModal(false); setBulkRows([]); setBulkResults(null); }} className="btn-outline-gold rounded-xl">{t('emp.close')}</button>
              {bulkRows.length > 0 && !bulkResults && (
                <button onClick={submitBulk} disabled={bulkLoading} className="btn-gold rounded-xl flex items-center gap-2">
                  {bulkLoading ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <Save size={16} />}
                  {bulkLoading ? t('emp.updating') : t('emp.updateProducts', { count: bulkRows.length })}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ImeiScanModal open={showImeiScan} onClose={() => setShowImeiScan(false)} />
    </div>
  );
}
