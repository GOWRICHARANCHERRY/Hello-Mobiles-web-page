import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useCart } from '../../context/CartContext';
import { Star, ShoppingCart, Eye, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();

  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    ram: searchParams.get('ram') || '',
    storage: searchParams.get('storage') || '',
    sortBy: searchParams.get('sortBy') || '',
    search: searchParams.get('search') || '',
  });

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => { if (val) params.set(key, val); });
    setSearchParams(params);

    setLoading(true);
    api.get(`/products?${params.toString()}`)
      .then(r => { setProducts(r.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', brand: '', minPrice: '', maxPrice: '', ram: '', storage: '', sortBy: '', search: '' });
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">
          {filters.search ? `Results for "${filters.search}"` : filters.category || 'All Products'}
        </h1>
        <div className="flex items-center gap-3">
          <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="">Sort By</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
            <option value="rating">Rating</option>
          </select>
          <button onClick={() => setShowFilters(!showFilters)} className="md:hidden bg-primary-600 text-white px-3 py-2 rounded-lg flex items-center gap-1">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters Sidebar */}
        <div className={`${showFilters ? 'fixed inset-0 z-50 bg-black/50 md:relative md:bg-transparent' : 'hidden'} md:block`}>
          <div className={`${showFilters ? 'absolute right-0 top-0 h-full w-72 bg-white p-4 overflow-y-auto' : 'w-64 flex-shrink-0'} md:relative md:w-64 bg-white rounded-xl shadow-sm p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Filters</h3>
              <div className="flex gap-2">
                <button onClick={clearFilters} className="text-sm text-primary-600 hover:underline">Clear All</button>
                {showFilters && <button onClick={() => setShowFilters(false)}><X size={20} /></button>}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-medium text-sm text-gray-700 mb-2 block">Category</label>
                {['Mobiles', 'TVs', 'Smart Watches', 'Earbuds', 'Laptops', 'Home Appliances'].map(cat => (
                  <label key={cat} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="category" checked={filters.category === cat} onChange={() => handleFilterChange('category', filters.category === cat ? '' : cat)} className="text-primary-600" />
                    <span className="text-sm">{cat}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 mb-2 block">Brand</label>
                {['Apple', 'Samsung', 'Vivo', 'Oppo', 'Realme', 'Redmi', 'Sony', 'LG'].map(brand => (
                  <label key={brand} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="brand" checked={filters.brand === brand} onChange={() => handleFilterChange('brand', filters.brand === brand ? '' : brand)} className="text-primary-600" />
                    <span className="text-sm">{brand}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 mb-2 block">Price Range</label>
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={filters.minPrice} onChange={e => handleFilterChange('minPrice', e.target.value)}
                    className="w-1/2 border rounded-lg px-2 py-1.5 text-sm" />
                  <input type="number" placeholder="Max" value={filters.maxPrice} onChange={e => handleFilterChange('maxPrice', e.target.value)}
                    className="w-1/2 border rounded-lg px-2 py-1.5 text-sm" />
                </div>
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 mb-2 block">RAM</label>
                {['4 GB', '6 GB', '8 GB', '12 GB', '16 GB'].map(ram => (
                  <label key={ram} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="ram" checked={filters.ram === ram} onChange={() => handleFilterChange('ram', filters.ram === ram ? '' : ram)} className="text-primary-600" />
                    <span className="text-sm">{ram}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="font-medium text-sm text-gray-700 mb-2 block">Storage</label>
                {['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'].map(storage => (
                  <label key={storage} className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="storage" checked={filters.storage === storage} onChange={() => handleFilterChange('storage', filters.storage === storage ? '' : storage)} className="text-primary-600" />
                    <span className="text-sm">{storage}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-white rounded-xl shadow-sm p-4 animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-3"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/3 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl">
              <p className="text-gray-500 text-lg">No products found</p>
              <button onClick={clearFilters} className="text-primary-600 mt-2 hover:underline">Clear filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(product => (
                <Link key={product._id} to={`/products/${product._id}`} className="bg-white rounded-xl shadow-sm overflow-hidden card-hover block">
                  <div className="bg-gray-100 p-4 h-48 flex items-center justify-center relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="h-full object-contain" />
                    ) : (
                      <div className="text-gray-400">No Image</div>
                    )}
                    {product.mrp > product.price && (
                      <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% OFF
                      </span>
                    )}
                    {product.stock <= 0 && <span className="absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded">Out of Stock</span>}
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-500">{product.brand}</p>
                    <h3 className="font-semibold text-gray-800 text-sm mt-1 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-lg font-bold text-gray-900">₹{product.price.toLocaleString()}</span>
                      {product.mrp > product.price && <span className="text-sm text-gray-400 line-through">₹{product.mrp.toLocaleString()}</span>}
                    </div>
                    {product.ratings > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={12} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-gray-600">{product.ratings}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-3">
                      <button onClick={(e) => handleAddToCart(product, e)} disabled={product.stock <= 0}
                        className="flex-1 bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-50 flex items-center justify-center gap-1">
                        <ShoppingCart size={14} /> Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
