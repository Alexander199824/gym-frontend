// src/components/payments/PaymentHistoryCard.js
// UBICACIÓN: /gym-frontend/src/components/payments/PaymentHistoryCard.js
// FUNCIÓN: Componente para mostrar historial de pagos
// USADO EN: ClientDashboard, páginas de pagos

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  CreditCard, 
  Banknote, 
  Smartphone,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Download,
  Upload
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const PaymentHistoryCard = ({ 
  payments, 
  showActions = false,
  showUser = false,
  onViewPayment = null,
  className = ''
}) => {
  const { formatCurrency, formatDate } = useApp();
  
  // 🎯 Obtener configuración del método de pago
  const getPaymentMethodConfig = (method) => {
    const configs = {
      cash: {
        icon: Banknote,
        label: 'Efectivo',
        color: 'text-green-600',
        bg: 'bg-green-50'
      },
      card: {
        icon: CreditCard,
        label: 'Tarjeta',
        color: 'text-blue-600',
        bg: 'bg-blue-50'
      },
      transfer: {
        icon: Smartphone,
        label: 'Transferencia',
        color: 'text-purple-600',
        bg: 'bg-purple-50'
      },
      online: {
        icon: CreditCard,
        label: 'En línea',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50'
      }
    };
    
    return configs[method] || configs.cash;
  };
  
  // 🎯 Obtener configuración del estado
  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        icon: CheckCircle,
        label: 'Completado',
        color: 'text-green-600',
        bg: 'bg-green-50'
      },
      pending: {
        icon: Clock,
        label: 'Pendiente',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50'
      },
      failed: {
        icon: XCircle,
        label: 'Fallido',
        color: 'text-red-600',
        bg: 'bg-red-50'
      },
      cancelled: {
        icon: XCircle,
        label: 'Cancelado',
        color: 'text-gray-600',
        bg: 'bg-gray-50'
      },
      refunded: {
        icon: AlertCircle,
        label: 'Reembolsado',
        color: 'text-orange-600',
        bg: 'bg-orange-50'
      }
    };
    
    return configs[status] || configs.pending;
  };
  
  // 🎯 Obtener tipo de pago
  const getPaymentTypeLabel = (type) => {
    const types = {
      membership: 'Membresía',
      daily: 'Pago diario',
      bulk_daily: 'Pago múltiple'
    };
    
    return types[type] || type;
  };
  
  if (payments.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay pagos registrados
          </h3>
          <p className="text-gray-600">
            Los pagos aparecerán aquí cuando se registren.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="divide-y divide-gray-200">
        {payments.map((payment) => {
          const methodConfig = getPaymentMethodConfig(payment.paymentMethod);
          const statusConfig = getStatusConfig(payment.status);
          const MethodIcon = methodConfig.icon;
          const StatusIcon = statusConfig.icon;
          
          return (
            <div 
              key={payment.id} 
              className="p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-between">
                
                {/* 📊 INFORMACIÓN PRINCIPAL */}
                <div className="flex items-center flex-1">
                  
                  {/* 🎯 ICONO DEL MÉTODO */}
                  <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center
                    ${methodConfig.bg}
                  `}>
                    <MethodIcon className={`w-5 h-5 ${methodConfig.color}`} />
                  </div>
                  
                  {/* 📋 DETALLES */}
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {getPaymentTypeLabel(payment.paymentType)}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {methodConfig.label} • {formatDate(payment.paymentDate)}
                        </p>
                        
                        {/* 👤 USUARIO (si se muestra) */}
                        {showUser && payment.user && (
                          <p className="text-xs text-gray-500 mt-1">
                            {payment.user.firstName} {payment.user.lastName}
                          </p>
                        )}
                        
                        {/* 📝 DESCRIPCIÓN */}
                        {payment.description && (
                          <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                            {payment.description}
                          </p>
                        )}
                      </div>
                      
                      {/* 💰 MONTO */}
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </p>
                        
                        {/* 📊 CANTIDAD DIARIA (si aplica) */}
                        {payment.paymentType === 'bulk_daily' && payment.dailyPaymentCount > 1 && (
                          <p className="text-xs text-gray-500">
                            {payment.dailyPaymentCount} entradas
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 🎯 ESTADO Y ACCIONES */}
                    <div className="flex items-center justify-between mt-2">
                      
                      {/* 📊 ESTADO */}
                      <div className="flex items-center">
                        <StatusIcon className={`w-4 h-4 ${statusConfig.color} mr-2`} />
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium
                          ${statusConfig.bg} ${statusConfig.color}
                        `}>
                          {statusConfig.label}
                        </span>
                        
                        {/* 🔄 TRANSFERENCIA PENDIENTE */}
                        {payment.paymentMethod === 'transfer' && payment.status === 'pending' && (
                          <span className="ml-2 text-xs text-yellow-600">
                            Esperando validación
                          </span>
                        )}
                      </div>
                      
                      {/* 🎯 ACCIONES */}
                      {showActions && (
                        <div className="flex items-center space-x-2">
                          
                          {/* Ver detalles */}
                          {onViewPayment ? (
                            <button
                              onClick={() => onViewPayment(payment)}
                              className="text-primary-600 hover:text-primary-500 text-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          ) : (
                            <Link
                              to={`/dashboard/payments/${payment.id}`}
                              className="text-primary-600 hover:text-primary-500 text-xs"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          )}
                          
                          {/* Subir comprobante */}
                          {payment.paymentMethod === 'transfer' && 
                           payment.status === 'pending' && 
                           !payment.transferProof && (
                            <Link
                              to={`/dashboard/payments/${payment.id}/upload-proof`}
                              className="text-blue-600 hover:text-blue-500 text-xs"
                              title="Subir comprobante"
                            >
                              <Upload className="w-4 h-4" />
                            </Link>
                          )}
                          
                          {/* Descargar comprobante */}
                          {payment.transferProof && (
                            <a
                              href={payment.transferProof}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-500 text-xs"
                              title="Ver comprobante"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 📊 VARIANTE: Tarjeta compacta de pago
export const CompactPaymentCard = ({ 
  payment, 
  onClick = null,
  showUser = false 
}) => {
  const { formatCurrency, formatDate } = useApp();
  
  const methodConfig = {
    cash: { icon: Banknote, label: 'Efectivo', color: 'text-green-600' },
    card: { icon: CreditCard, label: 'Tarjeta', color: 'text-blue-600' },
    transfer: { icon: Smartphone, label: 'Transferencia', color: 'text-purple-600' },
    online: { icon: CreditCard, label: 'En línea', color: 'text-indigo-600' }
  }[payment.paymentMethod] || { icon: Banknote, label: 'Efectivo', color: 'text-green-600' };
  
  const MethodIcon = methodConfig.icon;
  
  return (
    <div 
      className={`
        bg-white rounded-lg shadow border p-4 transition-all duration-200
        ${onClick ? 'hover:shadow-lg cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <MethodIcon className={`w-4 h-4 ${methodConfig.color}`} />
          </div>
          
          <div className="ml-3">
            {showUser && payment.user && (
              <p className="text-sm font-medium text-gray-900">
                {payment.user.firstName} {payment.user.lastName}
              </p>
            )}
            <p className="text-sm text-gray-600">
              {payment.paymentType === 'membership' ? 'Membresía' : 'Pago diario'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(payment.paymentDate)}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">
            {formatCurrency(payment.amount)}
          </p>
          <p className={`text-xs ${
            payment.status === 'completed' ? 'text-green-600' : 
            payment.status === 'pending' ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {payment.status === 'completed' ? 'Completado' : 
             payment.status === 'pending' ? 'Pendiente' : 
             'Fallido'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 📊 VARIANTE: Resumen de pagos
export const PaymentSummaryCard = ({ 
  payments, 
  period = 'mes',
  className = '' 
}) => {
  const { formatCurrency } = useApp();
  
  const completedPayments = payments.filter(p => p.status === 'completed');
  const totalAmount = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalCount = completedPayments.length;
  
  const paymentsByMethod = completedPayments.reduce((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + parseFloat(payment.amount);
    return acc;
  }, {});
  
  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Resumen del {period}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-gray-600">Total recaudado</p>
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">
            {totalCount}
          </p>
          <p className="text-sm text-gray-600">Pagos completados</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Por método de pago:</h4>
        {Object.entries(paymentsByMethod).map(([method, amount]) => (
          <div key={method} className="flex justify-between text-sm">
            <span className="text-gray-600 capitalize">
              {method === 'cash' ? 'Efectivo' : 
               method === 'card' ? 'Tarjeta' : 
               method === 'transfer' ? 'Transferencia' : 
               method}
            </span>
            <span className="font-medium text-gray-900">
              {formatCurrency(amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentHistoryCard;