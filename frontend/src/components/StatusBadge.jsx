import React from 'react';

const StatusBadge = ({ status, type = 'order' }) => {
  if (!status) return null;

  let colorClasses = 'bg-gray-100 text-gray-800 border-gray-200';

  if (type === 'order') {
    switch (status) {
      case 'PLACED':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'CONFIRMED':
        colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
        break;
      case 'PROCESSING':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'SHIPPED':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      case 'OUT_FOR_DELIVERY':
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'DELIVERED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'CANCELLED':
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        break;
      default:
        break;
    }
  } else if (type === 'payment') {
    switch (status) {
      case 'SUCCESS':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'PENDING':
        colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
        break;
      case 'FAILED':
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        break;
      case 'REFUNDED':
        colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
        break;
      default:
        break;
    }
  } else if (type === 'shipment') {
    switch (status) {
      case 'PENDING':
        colorClasses = 'bg-gray-50 text-gray-700 border-gray-200';
        break;
      case 'IN_TRANSIT':
        colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
        break;
      case 'OUT_FOR_DELIVERY':
        colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
        break;
      case 'DELIVERED':
        colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
        break;
      case 'RETURNED':
        colorClasses = 'bg-red-50 text-red-700 border-red-200';
        break;
      default:
        break;
    }
  }

  const formatText = (text) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      {formatText(status)}
    </span>
  );
};

export default StatusBadge;
