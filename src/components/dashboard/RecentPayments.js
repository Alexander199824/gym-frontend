// src/components/dashboard/RecentPayments.js
// UBICACIÓN: /gym-frontend/src/components/dashboard/RecentPayments.js
// FUNCIÓN: Pagos recientes del día

import React from 'react';
import { DollarSign, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const RecentPayments = ({ payments = [], isLoading = false }) => {
  const { formatCurrency } = useApp();

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4 text-green-600" />;
      case 'card':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="animate-pulse bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <DollarSign className="w-8 h-8 mx-auto mb-2" />
        <p>No hay pagos registrados hoy</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <div key={payment.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                {getPaymentIcon(payment.paymentMethod)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {payment.user?.firstName} {payment.user?.lastName}
                </p>
                <p className="text-xs text-gray-600">
                  {payment.paymentType === 'membership' ? 'Membresía' : 'Pago diario'} - 
                  {payment.paymentMethod === 'cash' ? ' Efectivo' : 
                   payment.paymentMethod === 'card' ? ' Tarjeta' : ' Transferencia'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-green-600">
                {formatCurrency ? formatCurrency(payment.amount) : `$${payment.amount}`}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(payment.paymentDate).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecentPayments;