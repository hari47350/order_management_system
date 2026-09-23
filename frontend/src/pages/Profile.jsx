import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { User, MapPin, Plus, CheckCircle, Package, Lock, Key } from 'lucide-react';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Address form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'USA',
    isDefault: false,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Password Security Form
  const [showPassForm, setShowPassForm] = useState(false);
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profRes, addrRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/users/addresses')
      ]);
      setProfile(profRes.data);
      setAddresses(addrRes.data);
    } catch (err) {
      console.error('Failed to load profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      await api.post('/users/addresses', newAddress);
      setShowAddForm(false);
      setNewAddress({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'USA',
        isDefault: false,
      });
      fetchProfileData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMsg({ type: '', text: '' });
    try {
      setPassLoading(true);
      const res = await api.post('/auth/change-password', passData);
      setPassMsg({ type: 'success', text: res.data?.message || 'Password changed successfully!' });
      setPassData({ currentPassword: '', newPassword: '' });
      setTimeout(() => setShowPassForm(false), 2500);
    } catch (err) {
      setPassMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update password.' });
    } finally {
      setPassLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-8">My Account & Addresses</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit space-y-4">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 text-indigo-700 w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl">
              {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base">{profile?.fullName}</h2>
              <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2 text-xs">
            <div>
              <span className="text-gray-400 block font-medium">Email</span>
              <span className="text-gray-800 font-semibold">{profile?.email}</span>
            </div>
            {profile?.phone && (
              <div>
                <span className="text-gray-400 block font-medium">Phone</span>
                <span className="text-gray-800 font-semibold">{profile?.phone}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 block font-medium">Total Orders</span>
              <span className="text-emerald-600 font-bold text-sm flex items-center mt-0.5">
                <Package className="w-3.5 h-3.5 mr-1" />
                {profile?.orderCount || 0} orders
              </span>
            </div>
          </div>

          {/* Security & Password */}
          <div className="border-t border-gray-100 pt-4">
            <button
              onClick={() => {
                setShowPassForm(!showPassForm);
                setPassMsg({ type: '', text: '' });
              }}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl border border-slate-200 transition"
            >
              <div className="flex items-center space-x-2">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Security &amp; Password</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">{showPassForm ? 'Close' : 'Update'}</span>
            </button>

            {showPassForm && (
              <form onSubmit={handleChangePassword} className="mt-3 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                {passMsg.text && (
                  <div className={`p-2 rounded-lg text-xs font-medium ${passMsg.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {passMsg.text}
                  </div>
                )}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={passData.currentPassword}
                    onChange={(e) => setPassData({ ...passData, currentPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-emerald-500 focus:outline-none"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={passData.newPassword}
                    onChange={(e) => setPassData({ ...passData, newPassword: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-emerald-500 focus:outline-none"
                    placeholder="At least 6 characters"
                  />
                </div>
                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-2 rounded-lg transition"
                >
                  {passLoading ? 'Updating...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Addresses Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center space-x-1 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'Cancel' : 'Add New Address'}</span>
            </button>
          </div>

          {/* Add Address Form */}
          {showAddForm && (
            <form onSubmit={handleAddAddress} className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-800">New Address Details</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={newAddress.street}
                  onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                  placeholder="e.g. 742 Evergreen Terrace"
                  className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">State / Province</label>
                  <input
                    type="text"
                    required
                    value={newAddress.state}
                    onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={newAddress.postalCode}
                    onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={newAddress.country}
                    onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newAddress.isDefault}
                  onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="isDefault" className="text-xs text-gray-700">Set as default shipping address</label>
              </div>

              <button
                type="submit"
                disabled={formLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
              >
                {formLoading ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}

          {/* List of saved addresses */}
          {addresses.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center text-sm text-gray-500">
              No saved addresses found. Add one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white p-5 rounded-xl border relative shadow-sm ${
                    addr.isDefault ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                  }`}
                >
                  {addr.isDefault && (
                    <span className="absolute top-3 right-3 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" /> Default
                    </span>
                  )}
                  <MapPin className="w-5 h-5 text-gray-400 mb-2" />
                  <p className="font-semibold text-gray-900 text-xs">{addr.street}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {addr.city}, {addr.state} {addr.postalCode}
                  </p>
                  <p className="text-xs text-gray-500">{addr.country}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
