import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import { Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_LIST = [
  'ALL',
  'PLACED',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [selectedStatus, currentPage]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        size: 10,
      };
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      const res = await api.get('/admin/orders', { params });
      setOrders(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  const openOrderModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setModalMessage('');
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder || newStatus === selectedOrder.status) return;

    try {
      setUpdating(true);
      setModalMessage('');
      const res = await api.put(`/admin/orders/${selectedOrder.id}/status`, {
        status: newStatus,
      });
      setSelectedOrder(res.data);
      setModalMessage(`Status updated successfully to ${newStatus}`);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid status transition.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Order Fulfillment & Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review orders across customers, update shipment stages, and manage cancellations</p>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-gray-600">Filter Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs bg-white focus:ring-indigo-500"
          >
            {STATUS_LIST.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          No orders found matching the filter.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Order Status</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                    {order.orderNumber}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-900">{order.customerName}</div>
                    <div className="text-[11px] text-gray-400">{order.customerEmail}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-gray-900">
                    ₹{order.totalAmount.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    {order.payment && (
                      <div className="space-y-1">
                        <StatusBadge status={order.payment.paymentStatus} type="payment" />
                        <span className="text-[10px] text-gray-400 block">{order.payment.paymentMethod}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={order.status} type="order" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => openOrderModal(order)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-700 rounded-lg font-bold transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Manage</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-3 pt-4">
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

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-lg">{selectedOrder.orderNumber}</h3>
                <span className="text-xs text-gray-500">Customer: {selectedOrder.customerName} ({selectedOrder.customerEmail})</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
                ✕
              </button>
            </div>

            {modalMessage && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{modalMessage}</span>
              </div>
            )}

            {/* Current State update form */}
            <form onSubmit={handleUpdateStatus} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <label className="block text-xs font-bold text-gray-700">Update Order Lifecycle Status</label>
              <div className="flex items-center space-x-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg p-2 text-xs font-semibold bg-white focus:ring-indigo-500"
                >
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED (Restores inventory)</option>
                </select>
                <button
                  type="submit"
                  disabled={updating || newStatus === selectedOrder.status}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>

            {/* Order Items */}
            <div>
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Order Items</h4>
              <div className="border rounded-xl divide-y text-xs">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="p-2.5 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-900">{item.productName}</div>
                      <div className="text-[11px] text-gray-500">₹{item.unitPrice.toFixed(2)} × {item.quantity}</div>
                    </div>
                    <div className="font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipment & Address */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-xl">
              <div>
                <span className="text-gray-400 font-medium block">Tracking Number</span>
                <span className="font-mono font-bold text-indigo-600">{selectedOrder.shipment?.trackingNumber || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-400 font-medium block">Shipment Status</span>
                <StatusBadge status={selectedOrder.shipment?.status} type="shipment" />
              </div>
              <div className="col-span-2 pt-2 border-t border-gray-200">
                <span className="text-gray-400 font-medium block">Shipping Address:</span>
                <span className="text-gray-700">{selectedOrder.shippingAddress}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
