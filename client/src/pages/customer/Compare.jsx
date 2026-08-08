import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useCompare } from '../../context/CompareContext';
import { useLanguage } from '../../context/LanguageContext';
import SEO from '../../components/SEO';
import { Scale, Trash2, ArrowLeft } from 'lucide-react';

export default function Compare() {
  const { compare, removeFromCompare, clearCompare } = useCompare();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (compare.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(compare.map(id => api.get(`/products/${id}`).then(r => r.data).catch(() => null)))
      .then(list => { setProducts(list.filter(Boolean)); setLoading(false); });
  }, [compare]);

  const allSpecKeys = [...new Set(
    products.flatMap(p => Object.keys(p.specifications || {}).filter(k => k && k !== 'other'))
  )];

  const priceOf = (p) => p.variants?.length ? Math.min(...p.variants.map(v => v.price)) : p.price;
  const emiOf = (p) => Math.round((priceOf(p) || 0) / 12);

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gold-500"></div></div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <SEO title={t('cust.compareTitle')} description={t('cust.compareEmptyText')} path="/compare" />
        <Scale size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-800 mb-2">{t('cust.compareEmptyTitle')}</h2>
        <p className="text-gray-500 mb-6 max-w-md mx-auto">{t('cust.compareEmptyText')}</p>
        <Link to="/products" className="bg-gold-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gold-700 transition inline-block">{t('cust.compareBrowse')}</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SEO title={t('cust.compareTitle')} description={t('cust.compareEmptyText')} path="/compare" />
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/products" className="text-gray-500 hover:text-gray-700"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-gray-800">{t('cust.compareTitle')}</h1>
          <span className="text-sm text-gray-500">({compare.length})</span>
        </div>
        <button onClick={clearCompare} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 font-medium">
          <Trash2 size={14} /> {t('cust.compareClear')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-gold-100 shadow-sm bg-white">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-gold-100">
              <th className="text-left p-4 font-semibold text-gray-500 w-40">{t('cust.compareSpecs')}</th>
              {products.map(p => (
                <th key={p._id} className="p-4 text-left align-top w-60">
                  <Link to={`/products/${p._id}`}>
                    <img src={p.images?.[0]} alt={p.name} loading="lazy" className="w-32 h-32 object-contain mx-auto mb-2" />
                    <p className="font-semibold text-gray-800 leading-snug text-sm">{p.name}</p>
                  </Link>
                  <button onClick={() => removeFromCompare(p._id)} className="mt-2 text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                    <Trash2 size={12} /> {t('cust.compareRemove')}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="p-4 font-semibold text-gray-500">{t('cust.comparePrice')}</td>
              {products.map(p => (
                <td key={p._id} className="p-4">
                  <span className="text-lg font-bold text-gold-700">₹{priceOf(p)?.toLocaleString()}</span>
                </td>
              ))}
            </tr>
            <tr className="border-b border-gray-100 bg-gold-50/50">
              <td className="p-4 font-semibold text-gray-500">{t('cust.compareBrand')}</td>
              {products.map(p => <td key={p._id} className="p-4 text-gray-700">{p.brand || '—'}</td>)}
            </tr>
            <tr className="border-b border-gray-100">
              <td className="p-4 font-semibold text-gray-500">{t('cust.compareCategory')}</td>
              {products.map(p => <td key={p._id} className="p-4 text-gray-700">{p.category || '—'}</td>)}
            </tr>
            <tr className="border-b border-gray-100 bg-gold-50/50">
              <td className="p-4 font-semibold text-gray-500">{t('cust.compareEmi')}</td>
              {products.map(p => <td key={p._id} className="p-4 text-gray-700">₹{emiOf(p).toLocaleString()}</td>)}
            </tr>
            {allSpecKeys.map((key, i) => (
              <tr key={key} className={`border-b border-gray-100 ${i % 2 ? '' : 'bg-gold-50/50'}`}>
                <td className="p-4 font-medium text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</td>
                {products.map(p => <td key={p._id} className="p-4 text-gray-700">{p.specifications?.[key] || '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
