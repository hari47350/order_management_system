import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, ArrowLeft } from 'lucide-react';

const Cart = () => {
  const { cart, updateQuantity, removeItem, clearCart, loading } = useCart();
  const navigate = useNavigate();

  if (loading && cart.items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-500 mt-2">Looks like you haven't added any products yet.</p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          <span>Start Shopping</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-6 border-b border-gray-200 mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Shopping Cart</h1>
        <button
          onClick={clearCart}
          className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex items-center space-x-4 w-full sm:w-auto">
                <img
                  src={item.productImageUrl || 'https://via.placeholder.com/80x80?text=Product'}
                  alt={item.productName}
                  className="w-20 h-20 object-cover rounded-lg bg-gray-100 flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-gray-900 text-sm hover:text-indigo-600 transition">
                    <Link to={`/products/${item.productId}`}>{item.productName}</Link>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Unit Price: <span className="font-medium text-gray-800">₹{item.productPrice.toFixed(2)}</span>
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Stock remaining: {item.stockAvailable}
                  </p>
                </div>
              </div>

              {/* Quantity Controls & Subtotal */}
              <div className="flex items-center justify-between w-full sm:w-auto sm:space-x-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                {/* Quantity */}
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-bold text-gray-800">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stockAvailable}
                    className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 text-xs font-bold disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right">
                  <div className="text-sm font-extrabold text-gray-900">
                    ₹{item.subtotal.toFixed(2)}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-4">
            <Link to="/products" className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit space-y-5">
          <h2 className="text-lg font-bold text-gray-900 pb-3 border-b border-gray-100">Order Summary</h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Items Total ({cart.totalItems})</span>
              <span className="font-semibold text-gray-900">₹{cart.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Standard Shipping</span>
              <span className="font-semibold text-emerald-600">FREE</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Estimated Taxes</span>
              <span className="font-semibold text-gray-900">₹0.00</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-2xl font-extrabold text-indigo-600">₹{cart.subtotal.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold transition shadow-sm"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
