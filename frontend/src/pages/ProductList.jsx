import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Search, ShoppingCart, Check, AlertCircle, ArrowUpDown } from 'lucide-react';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOption, setSortOption] = useState('id,desc');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [addedItemNotice, setAddedItemNotice] = useState(null);

  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, sortOption, currentPage]);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?activeOnly=true');
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page: currentPage,
        size: 8,
        sort: sortOption,
        activeOnly: true,
      };
      if (searchTerm) params.search = searchTerm;
      if (selectedCategory) params.categoryId = selectedCategory;

      const res = await api.get('/products', { params });
      setProducts(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await addToCart(product.id, 1);
      setAddedItemNotice(product.name);
      setTimeout(() => setAddedItemNotice(null), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Notification */}
      {addedItemNotice && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-xl flex items-center space-x-2 z-50 animate-bounce">
          <Check className="w-5 h-5" />
          <span>Added <strong>{addedItemNotice}</strong> to cart!</span>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>⚡ CartToDoor Express &bull; Verified Inventory &amp; Direct Dispatch</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">From Cart to Your Doorstep</h1>
          <p className="text-sm text-slate-500 mt-1">Authentic products with live inventory tracking, dynamic pricing, and express doorstep delivery</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search products by title or keywords..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 shadow-xs transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
        </div>
      </div>

      {/* Filters & Sorting Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 my-6">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSelectedCategory('');
              setCurrentPage(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All Products
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setCurrentPage(0);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium">Sort by:</span>
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setCurrentPage(0);
            }}
            className="bg-white border border-gray-300 rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-indigo-500"
          >
            <option value="id,desc">Newest First</option>
            <option value="price,asc">Price: Low to High</option>
            <option value="price,desc">Price: High to Low</option>
            <option value="name,asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid / Loading / Error */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="bg-white rounded-xl shadow-sm border border-gray-200 h-80 animate-pulse p-4 flex flex-col justify-between">
              <div className="bg-gray-200 h-44 rounded-lg"></div>
              <div className="space-y-2 mt-4">
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
                <div className="bg-gray-200 h-4 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button
            onClick={fetchProducts}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200 p-8">
          <p className="text-gray-500 text-lg">No products found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-xs border border-slate-200/80 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Image */}
                <div className="h-48 w-full bg-slate-50 relative overflow-hidden">
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300x200?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {product.categoryName && (
                    <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-md text-slate-800 text-[11px] font-bold px-2.5 py-0.5 rounded-lg shadow-xs">
                      {product.categoryName}
                    </span>
                  )}
                  {product.stockQuantity <= 5 && product.stockQuantity > 0 && (
                    <span className="absolute top-2.5 right-2.5 bg-amber-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs">
                      Only {product.stockQuantity} left
                    </span>
                  )}
                  {product.stockQuantity === 0 && (
                    <span className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-xs">
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="p-4">
                  <Link to={`/products/${product.id}`} className="block">
                    <h3 className="font-bold text-slate-900 text-sm hover:text-emerald-600 transition leading-snug line-clamp-1">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
              </div>

              {/* Price & Action */}
              <div className="p-4 pt-0 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Unit Price</span>
                  <span className="text-lg font-black text-slate-900">₹{product.price.toFixed(2)}</span>
                </div>

                {!isAdmin && (
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stockQuantity === 0}
                    className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold disabled:from-slate-200 disabled:to-slate-300 disabled:text-slate-400 disabled:cursor-not-allowed transition shadow-sm shadow-emerald-600/20"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={currentPage === 0}
            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-xs text-gray-600 font-medium">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={currentPage >= totalPages - 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductList;
