import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import api from '../utils/api';
import { Search, X, Package, Tag, Folder, Clock, Trash2 } from 'lucide-react';

export default function SearchBar({ placeholder, className = '', autoFocus = false, initialValue = '', onSearch, size = 'normal' }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState({ products: [], brands: [], categories: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const fetchIdRef = useRef(0);
  const RECENT_KEY = 'hm_recent_searches';
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
  });

  const isLarge = size === 'large';

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback((searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 1) {
      setSuggestions({ products: [], brands: [], categories: [] });
      setShowDropdown(false);
      setLoading(false);
      return;
    }
    const thisFetch = ++fetchIdRef.current;
    setLoading(true);
    api.get(`/products/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}`)
      .then(r => {
        if (thisFetch === fetchIdRef.current) {
          setSuggestions(r.data);
          setShowDropdown(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (thisFetch === fetchIdRef.current) {
          setSuggestions({ products: [], brands: [], categories: [] });
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.trim().length < 1) {
      setSuggestions({ products: [], brands: [], categories: [] });
      if (!isFocused || recent.length === 0) setShowDropdown(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  const saveRecent = (term) => {
    const q = term.trim();
    if (!q) return;
    setRecent(prev => {
      const next = [q, ...prev.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      try { localStorage.setItem(RECENT_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const clearRecent = () => {
    setRecent([]);
    try { localStorage.removeItem(RECENT_KEY); } catch {}
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecent(query);
      setShowDropdown(false);
      if (onSearch) onSearch(query.trim());
      else navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleProductClick = (product) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/products/${product._id}`);
  };

  const handleBrandClick = (brand) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/products?brand=${encodeURIComponent(brand)}`);
  };

  const handleCategoryClick = (cat) => {
    setShowDropdown(false);
    setQuery('');
    navigate(`/products?category=${encodeURIComponent(cat)}`);
  };

  const handleSuggestionSearch = (term) => {
    saveRecent(term);
    setShowDropdown(false);
    if (onSearch) onSearch(term);
    else navigate(`/products?search=${encodeURIComponent(term)}`);
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions({ products: [], brands: [], categories: [] });
    setShowDropdown(recent.length > 0);
    if (onSearch) onSearch('');
    inputRef.current?.focus();
  };

  const hasResults = suggestions.products.length > 0 || suggestions.brands.length > 0 || suggestions.categories.length > 0;
  const showSuggestions = showDropdown && isFocused && (query || loading || recent.length > 0);

  const getHighlight = (text, q) => {
    if (!q) return text;
    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <span key={i} className="font-bold text-gold-700">{part}</span> : part
    );
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className={`flex ${isLarge ? 'rounded-2xl' : 'rounded-xl'} shadow-lg ${isFocused ? 'ring-4 ring-gold-200' : ''} transition-all`}>
        <div className="relative flex-1">
          <Search size={isLarge ? 20 : 16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              if (!query && recent.length > 0) setShowDropdown(true);
              else if (query && hasResults) setShowDropdown(true);
            }}
            placeholder={placeholder || t('comp.searchProducts')}
            autoFocus={autoFocus}
            className={`w-full ${isLarge ? 'pl-12 pr-10 py-4 text-base' : 'pl-10 pr-10 py-2.5 text-sm'} bg-white outline-none ${isLarge ? 'rounded-l-2xl' : 'rounded-l-xl'}`}
          />
          {query && (
            <button type="button" onClick={handleClear} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition">
              <X size={16} />
            </button>
          )}
        </div>
        <button type="submit" aria-label="Search"
          className={`gold-gradient text-white ${isLarge ? 'px-8 rounded-r-2xl' : 'px-5 rounded-r-xl'} hover:opacity-90 transition flex-shrink-0 flex items-center gap-2 font-medium ${isLarge ? 'text-sm' : 'text-xs'}`}>
          <Search size={isLarge ? 18 : 16} />
          {isLarge && t('comp.search')}
        </button>
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className={`absolute z-50 top-full left-0 right-0 mt-2 bg-white ${isLarge ? 'rounded-2xl' : 'rounded-xl'} shadow-2xl overflow-hidden max-h-[70vh] overflow-y-auto border border-gray-100`}>
          {!query && recent.length > 0 && (
            <>
              <div className="px-4 py-2 bg-gold-50 text-xs font-semibold text-gold-700 flex items-center gap-1.5 border-b border-gold-100">
                <Clock size={12} /> {t('comp.recentSearches')}
                <button type="button" onClick={clearRecent}
                  className="ml-auto text-[11px] font-medium text-gray-400 hover:text-red-500 flex items-center gap-1 transition normal-case">
                  <Trash2 size={11} /> {t('comp.clearAll')}
                </button>
              </div>
              {recent.map(term => (
                <button key={term} onClick={() => handleSuggestionSearch(term)}
                  className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-gold-50/70 transition-all text-left border-b border-gray-50 last:border-0 active:bg-gold-100">
                  <Clock size={14} className="text-gold-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 font-medium truncate">{term}</span>
                  <span className="text-xs text-gray-400 ml-auto flex-shrink-0">{t('comp.viewAll')}</span>
                </button>
              ))}
            </>
          )}

          {loading && (
              <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold-500 border-t-transparent"></div>
              {t('comp.searching')}
            </div>
          )}

          {!loading && !hasResults && query && (
            <div className="px-4 py-8 text-center">
              <Package size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500 mb-1">{t('comp.noResultsFor', { query })}</p>
              <button onClick={() => handleSuggestionSearch(query)} className="text-xs text-gold-700 hover:underline font-medium">
                {t('comp.searchAllProducts')}
              </button>
            </div>
          )}

          {!loading && hasResults && (
            <>
              {suggestions.products.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-gold-50 text-xs font-semibold text-gold-700 flex items-center gap-1.5 border-b border-gold-100">
                    <Package size={12} /> {t('comp.products')}
                  </div>
                  {suggestions.products.map(product => (
                    <button key={product._id} onClick={() => handleProductClick(product)}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-gold-50/70 transition-all text-left border-b border-gray-50 last:border-0 active:bg-gold-100">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt="" width="44" height="44" loading="lazy" className="w-11 h-11 rounded-xl object-contain bg-gray-50 flex-shrink-0 border border-gray-100" />
                      ) : (
                        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package size={16} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{getHighlight(product.name, query)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{product.brand} · {product.category}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(product.lowestVariantPrice || product.price)?.toLocaleString()}
                        </p>
                        {product.variants?.length > 0 && (
                          <p className="text-[10px] text-gray-400">{t('comp.starting')}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.brands.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-blue-50 text-xs font-semibold text-blue-700 flex items-center gap-1.5 border-b border-blue-100">
                    <Tag size={12} /> {t('comp.brands')}
                  </div>
                  {suggestions.brands.map(brand => (
                    <button key={brand} onClick={() => handleBrandClick(brand)}
                      className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-blue-50/70 transition-all text-left border-b border-gray-50 last:border-0 active:bg-blue-100">
                      <Tag size={14} className="text-blue-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{getHighlight(brand, query)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{t('comp.viewAll')}</span>
                    </button>
                  ))}
                </div>
              )}

              {suggestions.categories.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-green-50 text-xs font-semibold text-green-700 flex items-center gap-1.5 border-b border-green-100">
                    <Folder size={12} /> {t('comp.categories')}
                  </div>
                  {suggestions.categories.map(cat => (
                    <button key={cat} onClick={() => handleCategoryClick(cat)}
                      className="w-full px-4 py-2.5 flex items-center gap-2.5 hover:bg-green-50/70 transition-all text-left border-b border-gray-50 last:border-0 active:bg-green-100">
                      <Folder size={14} className="text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-700 font-medium">{getHighlight(cat, query)}</span>
                      <span className="text-xs text-gray-400 ml-auto">{t('comp.viewAll')}</span>
                    </button>
                  ))}
                </div>
              )}

              <button onClick={() => handleSuggestionSearch(query)}
                className="w-full px-4 py-3 bg-gray-50 text-sm font-semibold text-gold-700 hover:bg-gold-50 transition-all flex items-center justify-center gap-2 border-t border-gray-200">
                <Search size={14} /> {t('comp.searchAllResultsFor', { query })}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
