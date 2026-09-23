import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CreditCard, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PROCESSING', label: 'Processing' },
  { key: 'SHIPPED', label: 'Shipped' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { key: 'DELIVERED', label: 'Delivered' },
];

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch (err) {
      setError('Failed to load order details. You may not have permission to view this order.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? Stock will be restored and payment refunded.')) {
      return;
    }

    try {
      setCancelLoading(true);
      const res = await api.post(`/orders/${id}/cancel`);
      setOrder(res.data);
      setCancelMessage('Order has been cancelled successfully. Stock has been restored.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-gray-800">{error || 'Order not found'}</h2>
        <Link to="/orders" className="mt-4 inline-flex items-center text-indigo-600 hover:underline">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to My Orders
        </Link>
      </div>
    );
  }

  // Calculate current step index
  const getStepIndex = (status) => {
    return ORDER_STEPS.findIndex((s) => s.key === status);
  };

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isCancellable = ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(order.status);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 mb-6 transition">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
      </Link>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-6">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-gray-900">{order.orderNumber}</h1>
              <StatusBadge status={order.status} type="order" />
            </div>
            <p className="text-xs text-gray-500 mt-1 flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Placed on {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>

          {/* Cancel button */}
          {isCancellable && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelLoading}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-bold transition disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel Order'}
            </button>
          )}
        </div>

        {cancelMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{cancelMessage}</span>
          </div>
        )}

        {/* Tracking Stepper */}
        <div className="pt-8">
          <h2 className="text-sm font-bold text-gray-800 mb-6">Delivery Progress</h2>

          {isCancelled ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3 text-red-700">
              <XCircle className="w-6 h-6 flex-shrink-0" />
              <div>
                <div className="font-bold text-sm">Order Cancelled</div>
                <div className="text-xs">Inventory has been returned to stock and refunds processed.</div>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Stepper bar */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition ${
                          isCurrent
                            ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                            : isCompleted
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        {isCompleted ? '✓' : idx + 1}
                      </div>
                      <span
                        className={`mt-2 text-xs font-semibold ${
                          isCurrent ? 'text-indigo-600 font-bold' : isCompleted ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shipment Tracker Details */}
        {order.shipment && (
          <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl">
            <div>
              <span className="text-gray-400 font-medium block">Tracking Number</span>
              <span className="font-mono font-bold text-indigo-600 text-sm">{order.shipment.trackingNumber}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Carrier</span>
              <span className="font-semibold text-gray-800">{order.shipment.carrier}</span>
            </div>
            <div>
              <span className="text-gray-400 font-medium block">Shipment Status</span>
              <StatusBadge status={order.shipment.status} type="shipment" />
            </div>
          </div>
        )}
      </div>

      {/* Grid: Items Purchased & Payment Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ordered Items Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Items Purchased</h2>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.productName}</h4>
                  <p className="text-xs text-gray-500">
                    Price at purchase: ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                  </p>
                </div>
                <div className="font-extrabold text-gray-900">₹{item.subtotal.toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-4 flex justify-between items-center text-sm">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="text-xl font-extrabold text-indigo-600">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment & Shipping Cards */}
        <div className="space-y-6">
          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center space-x-2 text-gray-900 font-bold text-sm border-b border-gray-100 pb-3">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>Payment Details</span>
            </div>

            {order.payment && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method:</span>
                  <span className="font-bold text-gray-800">{order.payment.paymentMethod}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">Status:</span>
                  <StatusBadge status={order.payment.paymentStatus} type="payment" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Ref:</span>
                  <span className="font-mono text-gray-600 text-[11px]">{order.payment.transactionRef}</span>
                </div>
                {order.payment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paid At:</span>
                    <span className="text-gray-600">{new Date(order.payment.paidAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
            <div className="flex items-center space-x-2 text-gray-900 font-bold text-sm border-b border-gray-100 pb-3">
              <MapPin className="w-4 h-4 text-indigo-600" />
              <span>Shipping Address</span>
            </div>
            <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">
              {order.shippingAddress}
            </p>
            {order.notes && (
              <div className="text-[11px] text-gray-500 italic pt-2 border-t border-gray-100">
                Note: {order.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
