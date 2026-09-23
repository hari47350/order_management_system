import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  Package, 
  Shield, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'ROLE_ADMIN'
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_CUSTOMER' : 'ROLE_ADMIN';
    const actionName = newRole === 'ROLE_ADMIN' ? 'promote this user to Administrator' : 'demote this administrator to Customer';
    
    if (!window.confirm(`Are you sure you want to ${actionName}?`)) {
      return;
    }

    try {
      setActionError('');
      setActionSuccess('');
      await api.put(`/admin/customers/${userId}/role?role=${newRole}`);
      setActionSuccess(`Successfully updated role to ${newRole === 'ROLE_ADMIN' ? 'Administrator' : 'Customer'}`);
      fetchCustomers();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update role');
      setTimeout(() => setActionError(''), 4000);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setActionError('');
      await api.post('/admin/users', formData);
      setShowAddModal(false);
      setFormData({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'ROLE_ADMIN'
      });
      setActionSuccess('Successfully provisioned new account!');
      fetchCustomers();
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to create user account');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Account &amp; Administrator Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Review active customers, administrators, and manage administrative privileges</p>
        </div>
        <button
          onClick={() => {
            setActionError('');
            setShowAddModal(true);
          }}
          className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Administrator</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center space-x-2 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 bg-red-50 text-red-800 text-xs rounded-xl flex items-center space-x-2 border border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{actionError}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-sm text-gray-500">
          No accounts found.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Account Holder</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="py-3.5 px-4 flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-xs ${
                      c.role === 'ROLE_ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {c.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{c.fullName}</div>
                      <div className="text-[10px] text-gray-400">ID #{c.id}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    {c.role === 'ROLE_ADMIN' ? (
                      <span className="inline-flex items-center space-x-1 font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full text-[10px]">
                        <Shield className="w-3 h-3 text-purple-600" />
                        <span>Administrator</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px]">
                        Customer
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-600">
                    <div className="flex items-center space-x-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" />
                      <span>{c.email}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">
                    {c.phone ? (
                      <div className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{c.phone}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      <Package className="w-3 h-3 mr-1" />
                      {c.orderCount} orders
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-500">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{new Date(c.registeredAt).toLocaleDateString()}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {c.role === 'ROLE_ADMIN' ? (
                      <button
                        onClick={() => handleToggleRole(c.id, c.role)}
                        className="px-2.5 py-1 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg font-bold text-[11px] transition border border-transparent hover:border-red-200"
                      >
                        Demote
                      </button>
                    ) : (
                      <button
                        onClick={() => handleToggleRole(c.id, c.role)}
                        className="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg font-bold text-[11px] transition border border-purple-200"
                      >
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Administrator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-gray-900 text-base">Provision Administrator Account</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Hari Krishna"
                  className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. hari@carttodoor.com"
                  className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full border rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Account Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full border rounded-xl p-2.5 bg-white font-semibold text-xs"
                >
                  <option value="ROLE_ADMIN">Administrator (Full Access)</option>
                  <option value="ROLE_CUSTOMER">Customer</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Administrator</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCustomers;

