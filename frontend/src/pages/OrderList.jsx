import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { Package, ArrowRight, Clock, AlertCircle } from 'lucide-react';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    fetchOrders();
  }, [currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', {
        params: { page: currentPage, size: 8 }
      });
      setOrders(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      setError('Failed to load your orders.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-gray-200 mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order History</h1>
        <p className="text-sm text-gray-500 mt-1">Review past purchases and live delivery tracking</p>
      </div>

      {error ? (
        <div className="bg-red-50 p-6 rounded-xl text-center text-red-700">
          <AlertCircle className="w-8 h-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900">No orders placed yet</h3>
          <p className="text-sm text-gray-500 mt-1">Browse our products and make your first purchase.</p>
          <Link
            to="/products"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
          >
            Explore Catalog
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Order summary info */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-extrabold text-gray-900 text-base">{order.orderNumber}</span>
                  <StatusBadge status={order.status} type="order" />
                  {order.payment && <StatusBadge status={order.payment.paymentStatus} type="payment" />}
                </div>

                <div className="flex items-center text-xs text-gray-500 space-x-4">
                  <span className="flex items-center">
                    <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span>•</span>
                  <span>{order.items?.length || 0} item(s)</span>
                  {order.shipment?.trackingNumber && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-indigo-600 font-semibold">{order.shipment.trackingNumber}</span>
                    </>
                  )}
                </div>

                {/* Items snapshot */}
                <div className="text-xs text-gray-600 truncate max-w-lg">
                  {order.items?.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                </div>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between md:justify-end space-x-6 border-t md:border-t-0 pt-4 md:pt-0">
                <div className="text-right">
                  <span className="text-xs text-gray-400 block font-medium">Total</span>
                  <span className="text-xl font-extrabold text-gray-900">₹{order.totalAmount.toFixed(2)}</span>
                </div>

                <Link
                  to={`/orders/${order.id}`}
                  className="inline-flex items-center space-x-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-3 pt-6">
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
      )}
    </div>
  );
};

export default OrderList;
