// Autor: Alexander Echeverria
// Ubicación: /gym-frontend/src/components/dashboard/RecentPayments.js

import React from 'react';
import { Coins, CreditCard, Banknote, Smartphone } from 'lucide-react';
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
        return <Coins className="w-4 h-4 text-gray-600" />;
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
        <Coins className="w-8 h-8 mx-auto mb-2" />
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
                {formatCurrency ? formatCurrency(payment.amount) : `Q${payment.amount}`}
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

/*
FUNCIONALIDAD:
Este componente muestra los pagos más recientes realizados en el gimnasio durante el día actual.
Proporciona una vista rápida de las transacciones financieras para monitoreo en tiempo real.

CARACTERÍSTICAS:
- Lista de pagos del día con información detallada
- Iconos específicos para cada método de pago (efectivo, tarjeta, transferencia)
- Estado de carga con animación skeleton
- Formato de moneda en quetzales (Q)
- Información del usuario que realizó el pago
- Distinción entre pagos de membresía y pagos diarios
- Timestamps con hora local del pago
- Diseño visual con códigos de colores (verde para pagos exitosos)

MÉTODOS DE PAGO SOPORTADOS:
- cash: Efectivo (icono de billetes verde)
- card: Tarjeta (icono de tarjeta azul)
- transfer: Transferencia (icono de smartphone púrpura)
- default: Método genérico (icono de monedas gris)

ESTRUCTURA DE DATOS:
Recibe un array de pagos con la siguiente estructura:
- id: Identificador único del pago
- user: Objeto con firstName y lastName del usuario
- paymentMethod: Método de pago utilizado
- paymentType: Tipo de pago (membership o daily)
- amount: Monto del pago
- paymentDate: Fecha y hora del pago

CONEXIONES:
- Importa desde 'react' para funcionalidad del componente
- Importa iconos desde 'lucide-react' (Coins, CreditCard, Banknote, Smartphone)
- Utiliza useApp desde '../../contexts/AppContext' para formateo de moneda
- Utilizado en el dashboard principal para mostrar actividad financiera
- Recibe datos de componentes padre que consultan APIs de pagos
- Se integra con sistemas de facturación y contabilidad
- Conecta con módulos de usuarios y membresías

PROPÓSITO:
Facilitar el monitoreo en tiempo real de los ingresos del gimnasio, permitiendo al personal
administrativo verificar pagos recientes, identificar patrones de pago y mantener control
sobre la actividad financiera diaria para una mejor gestión operativa y contable.
*/