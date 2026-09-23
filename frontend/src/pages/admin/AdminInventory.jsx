import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add', 'subtract', 'set'
  const [adjustmentValue, setAdjustmentValue] = useState(10);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/inventory', {
        params: { lowStockOnly: lowStockOnly ? true : null, size: 50 }
      });
      setProducts(res.data.content || []);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    let payload = {};
    const val = parseInt(adjustmentValue);

    if (adjustmentType === 'add') {
      payload = { quantityChange: val };
    } else if (adjustmentType === 'subtract') {
      payload = { quantityChange: -val };
    } else {
      payload = { newStockQuantity: val };
    }

    try {
      setActionLoading(true);
      await api.put(`/admin/inventory/${selectedProduct.id}`, payload);
      setSelectedProduct(null);
      fetchInventory();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to adjust stock. Stock cannot become negative.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Real-Time Inventory Control</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor product quantities, prevent stockouts, and adjust inventory levels in MySQL</p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 bg-white px-3 py-2 border rounded-lg shadow-sm cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span>Show Low Stock (&le; 5 units) Only</span>
          </label>
          <button
            onClick={fetchInventory}
            className="p-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-gray-600"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
              <tr>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Inventory Status</th>
                <th className="py-3.5 px-4 text-right">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {products.map((p) => {
                const isLowStock = p.stockQuantity <= 5;
                const isOutOfStock = p.stockQuantity === 0;

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{p.name}</div>
                      <div className="text-[11px] text-gray-400">ID #{p.id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{p.categoryName}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-sm font-black ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600' : 'text-gray-900'}`}>
                        {p.stockQuantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Low Stock Warning
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Healthy Stock
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedProduct(p)}
                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg transition"
                      >
                        Adjust Stock
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-bold text-gray-900 text-base border-b pb-2">
              Adjust Inventory for <span className="text-indigo-600">{selectedProduct.name}</span>
            </h3>

            <div className="text-xs text-gray-500">
              Current Available Stock: <strong className="text-gray-800">{selectedProduct.stockQuantity} units</strong>
            </div>

            <form onSubmit={handleUpdateStock} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Adjustment Action</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('add')}
                    className={`py-2 px-1 text-center rounded-lg border font-bold ${
                      adjustmentType === 'add' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    + Add Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('subtract')}
                    className={`py-2 px-1 text-center rounded-lg border font-bold ${
                      adjustmentType === 'subtract' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    - Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentType('set')}
                    className={`py-2 px-1 text-center rounded-lg border font-bold ${
                      adjustmentType === 'set' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    = Set Exact
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Quantity Value</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={adjustmentValue}
                  onChange={(e) => setAdjustmentValue(e.target.value)}
                  className="w-full border rounded-lg p-2 focus:ring-indigo-500 text-sm font-bold"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2 border rounded-lg text-gray-600 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold disabled:opacity-50"
                >
                  {actionLoading ? 'Updating...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminInventory;
