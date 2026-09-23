import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { 
  IndianRupee, 
  ShoppingBag, 
  Users, 
  Boxes, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowRight 
} from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setMetrics(res.data);
    } catch (err) {
      setError('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 font-semibold">{error || 'Failed to fetch metrics'}</p>
        <button
          onClick={fetchDashboardMetrics}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CartToDoor Logistics &amp; Central Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">System Performance & Fulfillment</h1>
          <p className="text-sm text-slate-500 mt-1">Live aggregate business metrics queried directly from MySQL database</p>
        </div>
        <button
          onClick={fetchDashboardMetrics}
          className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Revenue</span>
            <div className="text-2xl font-black text-gray-900 mt-1">₹{metrics.totalRevenue?.toFixed(2)}</div>
            <span className="text-[11px] text-emerald-600 font-semibold mt-1 inline-block">Excluding cancelled</span>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{metrics.totalOrders}</div>
            <span className="text-[11px] text-gray-500 font-medium mt-1 inline-block">Lifetime customer orders</span>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Customers</span>
            <div className="text-2xl font-black text-gray-900 mt-1">{metrics.totalCustomers}</div>
            <span className="text-[11px] text-gray-500 font-medium mt-1 inline-block">Registered accounts</span>
          </div>
          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Low Stock Products</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{metrics.lowStockProducts}</div>
            <span className="text-[11px] text-amber-600 font-semibold mt-1 inline-block">Stock &le; 5 units</span>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Secondary Status Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Pending Orders</span>
            <div className="text-xl font-extrabold text-gray-900">{metrics.pendingOrders}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Delivered Orders</span>
            <div className="text-xl font-extrabold text-gray-900">{metrics.deliveredOrders}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-gray-500 font-medium">Cancelled Orders</span>
            <div className="text-xl font-extrabold text-gray-900">{metrics.cancelledOrders}</div>
          </div>
        </div>
      </div>

      {/* Orders by Status Breakdown & Quick Action Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Breakdown */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Real-Time Order Status Breakdown
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.statusBreakdown && Object.entries(metrics.statusBreakdown).map(([status, count]) => (
              <div key={status} className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <span className="text-[11px] font-bold text-gray-500 block truncate">{status}</span>
                <span className="text-lg font-black text-gray-900 mt-1 block">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Management Links */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
            Quick Management Links
          </h2>
          <div className="space-y-2 text-xs">
            <Link
              to="/admin/products"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-gray-700 bg-gray-50"
            >
              <span>Manage Products</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/categories"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-gray-700 bg-gray-50"
            >
              <span>Manage Categories</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/inventory"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-gray-700 bg-gray-50"
            >
              <span>Inventory Stock Control</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/orders"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-gray-700 bg-gray-50"
            >
              <span>Process Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/customers"
              className="flex items-center justify-between p-3 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition font-bold text-gray-700 bg-gray-50"
            >
              <span>View Registered Customers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
