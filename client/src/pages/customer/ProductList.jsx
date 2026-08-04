import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import LoginPopup from '../../components/LoginPopup';
import SearchBar from '../../components/SearchBar';
import { Star, ShoppingCart, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

function FilterSection({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gold-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2">
        <span className="font-medium text-sm text-gray-700">{title}</span>
        {open ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    ram: searchParams.get('ram') || '',
    storage: searchParams.get('storage') || '',
    screenSize: searchParams.get('screenSize') || '',
    color: searchParams.get('color') || '',
    sortBy: searchParams.get('sortBy') || '',
    search: searchParams.get('search') || '',
  });

  useEffect(() => {
    api.get('/products/brands').then(r => setBrands(r.data)).catch(() => {});
    api.get('/products/categories').then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const fromParams = {
      category: searchParams.get('category') || '',
      brand: searchParams.get('brand') || '',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      ram: searchParams.get('ram') || '',
      storage: searchParams.get('storage') || '',
      screenSize: searchParams.get('screenSize') || '',
      color: searchParams.get('color') || '',
      sortBy: searchParams.get('sortBy') || '',
      search: searchParams.get('search') || '',
    };
    setFilters(fromParams);
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => { if (val) params.set(key, val); });
    const newUrl = params.toString();
    const currentUrl = searchParams.toString();
    if (newUrl !== currentUrl) setSearchParams(params, { replace: true });

    setLoading(true);
    api.get(`/products?${newUrl}`)
      .then(r => { setProducts(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', ram: '', storage: '', screenSize: '', color: '', sortBy: '', search: '' });
  };

  const activeCount = Object.values(filters).filter(v => v && v !== '').length;

  const showMobileFilters = !filters.category || filters.category === 'Mobiles';

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return setShowLoginPopup(true);
    if (product.variants?.length > 0) {
      window.location.href = `/products/${product._id}`;
      return;
    }
    addToCart(product);
    toast.success(`${product.name} ${t('cust.addedToCart')}`);
  };

  const screenSizes = ['5.5 inch', '6.1 inch', '6.5 inch', '6.7 inch', '6.8 inch', '15.6 inch', '32 inch', '43 inch', '50 inch', '55 inch', '65 inch'];
  const colors = ['Black', 'White', 'Blue', 'Silver', 'Gold', 'Purple', 'Green', 'Red', 'Gray', 'Titanium', 'Natural Titanium', 'Natural Silver'];

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {filters.search ? `${t('cust.resultsFor')} "${filters.search}"` : filters.category || t('cust.allProducts')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} {t('cust.productsFound')}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)}
            className="border-2 border-gold-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50">
            <option value="">{t('cust.sortBy')}</option>
            <option value="price_low">{t('cust.priceLowToHigh')}</option>
            <option value="price_high">{t('cust.priceHighToLow')}</option>
            <option value="name">{t('cust.nameAZ')}</option>
            <option value="rating">{t('cust.rating')}</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden bg-gradient-to-r from-gold-500 to-gold-600 text-white px-4 py-2 rounded-xl flex items-center gap-1 text-sm font-medium shadow-lg">
            <Filter size={16} /> {t('cust.filter')} {activeCount > 0 && <span className="bg-white text-gold-600 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">{activeCount}</span>}
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 lg:relative lg:bg-transparent' : 'hidden'} lg:block`}>
          <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-80 bg-white p-5 overflow-y-auto shadow-2xl' : 'w-72 flex-shrink-0'} lg:relative lg:w-72 bg-white rounded-2xl shadow-sm p-5 gold-border`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg gold-text flex items-center gap-2"><Filter size={18} /> {t('cust.filters')}</h3>
              <div className="flex gap-2 items-center">
                {activeCount > 0 && (
                  <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full font-medium">{activeCount} {t('cust.active')}</span>
                )}
                <button onClick={clearFilters} className="text-sm text-gold-600 hover:underline font-medium">{t('cust.clearAll')}</button>
                {showFilters && <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 hover:bg-gray-100 rounded-lg"><X size={20} /></button>}
              </div>
            </div>

            <div>
              <FilterSection title={t('cust.category')}>
                <div className="space-y-1">
                  {categories.map(cat => (
                    <label key={cat} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gold-50 transition">
                      <input type="radio" name="category" checked={filters.category === cat}
                        onChange={() => handleFilterChange('category', filters.category === cat ? '' : cat)}
                        className="text-gold-600 w-4 h-4" />
                      <span className="text-sm">{cat}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title={t('cust.brand')}>
                <div className="space-y-1">
                  {brands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gold-50 transition">
                      <input type="radio" name="brand" checked={filters.brand === brand}
                        onChange={() => handleFilterChange('brand', filters.brand === brand ? '' : brand)}
                        className="text-gold-600 w-4 h-4" />
                      <span className="text-sm">{brand}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              <FilterSection title={t('cust.priceRange')}>
                <div className="flex gap-2 px-1">
                  <input type="number" placeholder="Min ₹" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                  <input type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 border-2 border-gold-200 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-gold-400 outline-none bg-gold-50/50" />
                </div>
              </FilterSection>

              {showMobileFilters && (
                <>
                  <FilterSection title="RAM">
                    <div className="space-y-1">
                      {['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'].map(ram => (
                        <label key={ram} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gold-50 transition">
                          <input type="radio" name="ram" checked={filters.ram === ram}
                            onChange={() => handleFilterChange('ram', filters.ram === ram ? '' : ram)}
                            className="text-gold-600 w-4 h-4" />
                          <span className="text-sm">{ram}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title={t('cust.storage')}>
                    <div className="space-y-1">
                      {['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map(storage => (
                        <label key={storage} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gold-50 transition">
                          <input type="radio" name="storage" checked={filters.storage === storage}
                            onChange={() => handleFilterChange('storage', filters.storage === storage ? '' : storage)}
                            className="text-gold-600 w-4 h-4" />
                          <span className="text-sm">{storage}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title={t('cust.screenSize')}>
                    <div className="space-y-1">
                      {screenSizes.map(size => (
                        <label key={size} className="flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-gold-50 transition">
                          <input type="radio" name="screenSize" checked={filters.screenSize === size}
                            onChange={() => handleFilterChange('screenSize', filters.screenSize === size ? '' : size)}
                            className="text-gold-600 w-4 h-4" />
                          <span className="text-sm">{size}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title={t('cust.color')} defaultOpen={false}>
                    <div className="flex flex-wrap gap-2 px-1">
                      {colors.map(color => (
                        <button key={color} onClick={() => handleFilterChange('color', filters.color === color ? '' : color)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition ${filters.color === color ? 'border-gold-500 bg-gold-100 text-gold-700' : 'border-gray-200 text-gray-600 hover:border-gold-300'}`}>
                          {color}
                        </button>
                      ))}
                    </div>
                  </FilterSection>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {/* Search Bar */}
          <div className="mb-4 hidden lg:block">
            <SearchBar
              placeholder={t('cust.searchProducts')}
              initialValue={filters.search}
              onSearch={(q) => handleFilterChange('search', q)}
            />
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse gold-border">
                  <div className="bg-gold-100 h-48 rounded-xl mb-3"></div>
                  <div className="bg-gold-100 h-4 rounded w-1/3 mb-2"></div>
                  <div className="bg-gold-100 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl gold-border">
              <p className="text-gray-500 text-lg font-medium">{t('cust.noProductsFound')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('cust.adjustFilters')}</p>
              <button onClick={clearFilters} className="btn-gold rounded-xl mt-4">{t('cust.clearAllFilters')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {products.map(product => (
                <Link key={product._id} to={`/products/${product._id}`} className="bg-white rounded-2xl shadow-sm overflow-hidden card-hover block gold-border">
                  <div className="bg-gray-100 p-4 h-36 sm:h-48 flex items-center justify-center relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} loading="lazy" className="h-full object-contain" />
                    ) : (
                      <div className="text-gray-400 text-sm">{t('cust.noImage')}</div>
                    )}
                    {product.mrp > product.price && !product.variants?.length && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                    {product.stock <= 0 && !product.variants?.length && <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded-full">{t('cust.outOfStock')}</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gold-600 font-medium">{product.brand}</p>
                    <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold gold-text">
                        {product.variants?.length > 0 ? (
                          <>₹{Math.min(...product.variants.map(v => v.price)).toLocaleString()}</>
                        ) : (
                          <>₹{product.price.toLocaleString()}</>
                        )}
                      </span>
                      {product.variants?.length > 0 ? (
                        <span className="text-xs text-gray-400">{t('cust.startingPrice')}</span>
                      ) : product.mrp > product.price ? (
                        <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>
                      ) : null}
                    </div>
                    {product.variants?.length > 1 && (
                      <p className="text-xs text-gray-500 mt-1">{product.variants.length} {t('cust.variantsAvailable')}</p>
                    )}
                    {product.ratings > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.ratings}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      {product.variants?.length > 0 ? (
                        <Link to={`/products/${product._id}`} className="flex-1 btn-gold rounded-xl text-sm py-2 flex items-center justify-center gap-1 text-center">
                          {t('cust.viewOptions')}
                        </Link>
                      ) : (
                        <button onClick={(e) => handleAddToCart(product, e)} disabled={product.stock <= 0}
                          className="flex-1 btn-gold rounded-xl text-sm py-2 flex items-center justify-center gap-1">
                          <ShoppingCart size={14} /> {t('cust.addToCart')}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLoginPopup && <LoginPopup onClose={() => setShowLoginPopup(false)} />}
    </div>
  );
}
