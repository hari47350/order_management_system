import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingCart, Check, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedNotice, setAddedNotice] = useState(false);

  const { isAuthenticated, isAdmin } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      setProduct(res.data);
    } catch (err) {
      setError('Product not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    try {
      await addToCart(product.id, quantity);
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add item to cart.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{error || 'Product not found'}</h2>
        <Link to="/products" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Catalog
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Product Image */}
        <div className="h-96 md:h-full bg-gray-50 p-8 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-100">
          <img
            src={product.imageUrl || 'https://via.placeholder.com/500x500?text=Product+Image'}
            alt={product.name}
            className="max-h-96 w-auto object-contain rounded-lg shadow-sm"
          />
        </div>

        {/* Product Info */}
        <div className="p-8 flex flex-col justify-between">
          <div>
            {product.categoryName && (
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                {product.categoryName}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-3">{product.name}</h1>
            <p className="text-3xl font-extrabold text-gray-900 mt-4">₹{product.price.toFixed(2)}</p>

            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">Description</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            {/* Stock status indicator */}
            <div className="mt-6 flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Availability:</span>
              {product.stockQuantity > 5 ? (
                <span className="text-emerald-700 font-bold text-sm bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  In Stock ({product.stockQuantity} available)
                </span>
              ) : product.stockQuantity > 0 ? (
                <span className="text-amber-700 font-bold text-sm bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                  Low Stock (Only {product.stockQuantity} remaining!)
                </span>
              ) : (
                <span className="text-red-700 font-bold text-sm bg-red-50 px-2.5 py-0.5 rounded border border-red-200">
                  Out of Stock
                </span>
              )}
            </div>
          </div>

          {/* Action section */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            {!isAdmin ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-semibold text-gray-700">Quantity:</label>
                  <div className="flex items-center border border-gray-300 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || product.stockQuantity === 0}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-bold text-gray-800">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stockQuantity, q + 1))}
                      disabled={quantity >= product.stockQuantity || product.stockQuantity === 0}
                      className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={product.stockQuantity === 0}
                  className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 px-6 rounded-xl font-bold shadow-sm transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{addedNotice ? 'Added to Cart!' : 'Add to Cart'}</span>
                </button>
              </div>
            ) : (
              <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-xl text-sm font-medium">
                Admin mode: You can edit or restock this product in the Admin portal.
              </div>
            )}

            {/* Feature perks */}
            <div className="grid grid-cols-3 gap-2 mt-6 text-center text-xs text-gray-500">
              <div className="p-2 bg-gray-50 rounded-lg flex flex-col items-center">
                <Truck className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Fast Shipping</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg flex flex-col items-center">
                <ShieldCheck className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Verified Stock</span>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg flex flex-col items-center">
                <RefreshCw className="w-4 h-4 text-indigo-600 mb-1" />
                <span>Easy Cancellation</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
